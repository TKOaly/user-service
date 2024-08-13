import { Request, Response, RequestHandler, ErrorRequestHandler, Router } from "express";
import JWT from "jsonwebtoken";
import { JWK } from "node-jose";
import csrf from "csurf";
import moment from "moment";
import Controller from "../interfaces/Controller";
import Service from "../models/Service";
import User, { removeNonRequestedData } from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import PrivacyPolicyService from "../services/PrivacyPolicyService";
import UserService from "../services/UserService";
import { pick } from "lodash";
import ServiceError from "../utils/ServiceError";
import { stringToServiceToken } from "../token/Token";
import AuthorizeMiddleware, { AuthorizedRequestHandler } from "../utils/AuthorizeMiddleware";
import ConsentService from "../services/ConsentService";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import { OAuthError } from "../utils/OAuthError";

const getIdToken = (user: User, scope: string[], service: Service, key: JWK.Key) => {
  const claimNames = getClaimNames(scope);
  const claims = pick(getUserClaims(user, claimNames), getAllowedClaims(service.dataPermissions));

  const token = {
    iss: process.env.ISSUER_ID,
    aud: service.serviceIdentifier,
    ...claims,
  };

  if (!service.secret) {
    throw new OAuthError("invalid_client").withDescription("service secret is not configured");
  }

  return JWT.sign(token, key.toPEM(true), {
    algorithm: "RS256",
    keyid: key.kid,
    expiresIn: "3h",
  });
};

const SUPPORTED_RESPONSE_TYPES = ["code", "token", "id_token"] as const;

type ResponseType = (typeof SUPPORTED_RESPONSE_TYPES)[number];

function isSupportedResponseType(value: unknown): value is ResponseType {
  return typeof value === "string" && ["code", "token", "id_token"].indexOf(value) !== -1;
}

const SCOPES: Record<string, string[]> = {
  openid: ["iss", "aud", "sub", "exp", "iat"],
  role: ["role"],
  profile: [
    "name",
    "family_name",
    "given_name",
    "middle_name",
    "nickname",
    "preferred_username",
    "profile",
    "picture",
    "website",
    "gender",
    "birthdate",
    "zoneinfo",
    "locale",
    "updated_at",
  ],
  email: ["email", "email_verified"],
  phone: ["phone_number", "phone_number_verified"],
  address: ["address"],
  membership: ["membership"],
  is_hy_student: ["is_hy_student"],
  is_hy_staff: ["is_hy_staff"],
  is_hyy_member: ["is_hyy_member"],
  is_tktdt_student: ["is_tktdt_student"],
};

// TODO: This could probably be a flatMap
const getClaimNames = (scopes: string[]) => scopes.map(scope => SCOPES[scope] ?? []).reduce((a, b) => [...a, ...b], []);

const getUserClaims = (user: User, claims: string[]) =>
  pick(
    {
      sub: String(user.id),
      name: user.name ?? user.screenName,
      nickname: user.screenName,
      preferred_username: user.username,
      email: user.email,
      phone_number: user.phone,
      phone_number_verified: false,
      is_hyy_member: user.isHYYMember,
      is_hy_staff: user.isHyStaff,
      is_hy_student: user.isHyStudent,
      address: { locality: user.residence },
      membership: user.membership,
      role: user.role,
      created_at: user.createdAt,
      is_tktl: user.isTKTL,
      email_verified: false,
      is_tktdt_student: user.isTKTDTStudent,
    },
    claims,
  );

const CLAIM_TO_PROPERTY_MAP: Record<string, Array<string>> = {
  sub: ["id"],
  name: ["name", "screenName"],
  nickname: ["screenName"],
  preferred_username: ["username"],
  email: ["email"],
  phone_number: ["phone"],
  is_hyy_member: ["isHYYMember"],
  is_hyy_staff: ["isHYYStaff"],
  address: ["residence"],
  membership: ["membership"],
  role: ["role"],
  created_at: ["createdAt"],
  is_tktl: ["isTKTL"],
  is_tktdt_student: ["isTKTDTStudent"],
};

const mapClaimsToUserProperties = (claims: string[]) =>
  claims.flatMap((claim: string) => CLAIM_TO_PROPERTY_MAP[claim] ?? []);

const CLAIMS = [
  ["sub"],
  ["preferred_username", "username"],
  ["name"],
  ["nickname"],
  ["email"],
  ["address"],
  ["phone_number", "phone_number_verified"],
  ["is_hyy_member"],
  ["membership"],
  ["role"],
  [],
  [],
  ["created_at"],
  ["is_tktl"],
  [],
  ["is_hy_staff"],
  ["is_hy_student"],
  ["is_tktdt_student"],
];

const getAllowedClaims = (permissions: number) =>
  CLAIMS.flatMap((claims, i) => (Math.pow(2, i) & permissions ? claims : []));

type FlowStateLogin = {
  service: Service;
  state: string | null;
  scope: string[];
  responseType: ResponseType;
  redirectUrl: string;
  step: "login";
};

type FlowStateGdpr = Omit<FlowStatePrivacy, "step"> & { step: "gdpr" };
type FlowStatePrivacy = Omit<FlowStateLogin, "step"> & { step: "privacy"; user: User };

type FlowState = FlowStateLogin | FlowStateGdpr | FlowStatePrivacy;

type FlowInitOptions = Pick<FlowState, "state" | "service" | "scope" | "responseType" | "redirectUrl">;

type AuthorizationCodeContext = {
  user: User;
  service: Service;
  scope: string[];
};

const extractService = async (req: Request) => {
  if (req.query.client_id === undefined) {
    throw new OAuthError("invalid_request").withDescription("Parameter client_id is missing");
  }

  if (typeof req.query.client_id !== "string") {
    throw new OAuthError("invalid_request").withDescription("Parameter client_id has invalid value");
  }

  const client_id = req.query.client_id;

  try {
    return await AuthenticationService.getServiceWithIdentifier(client_id);
  } catch {
    throw new OAuthError("invalid_request").withDescription(`Unknown client ID '${client_id}'.`);
  }
};

class OAuthController implements Controller {
  private route: Router;
  private flows: Map<string, FlowState> = new Map();
  private codes: Map<string, AuthorizationCodeContext> = new Map();
  private openidPrivateKey: JWK.Key | null = null;
  public csrfMiddleware: RequestHandler;

  constructor() {
    this.route = Router();

    this.csrfMiddleware = csrf({
      cookie: true,
    });
  }

  async getOpenIDPrivateKey() {
    if (!this.openidPrivateKey) {
      this.openidPrivateKey = await JWK.asKey(process.env.OPENID_PRIVATE_KEY!, "pem", { use: "sig", alg: "RS256" });
    }

    return this.openidPrivateKey;
  }

  private createFlow(options: FlowInitOptions): string {
    // FIXME: This has potential to cause collisions
    const id = Math.random().toString(16).slice(2);

    this.flows.set(id, {
      ...options,
      step: "login",
    });

    return id;
  }

  private auth: AuthorizedRequestHandler = async (req, res) => {
    const state = req.query.state ? String(req.query.state) : null;

    let service;

    try {
      service = await extractService(req);
    } catch (err) {
      if (err instanceof OAuthError) {
        throw err.withState(state);
      } else {
        throw err;
      }
    }

    if (req.query.redirect_uri === undefined) {
      throw new OAuthError("invalid_request").withDescription("Missing parameter redirect_uri").withState(state);
    }

    if (typeof req.query.redirect_uri !== "string") {
      throw new OAuthError("invalid_request")
        .withDescription("Parameter redirect_uri has invalid value")
        .withState(state);
    }

    const redirectUrl = req.query.redirect_uri;

    if (service.redirectUrl !== redirectUrl) {
      throw new OAuthError("invalid_request")
        .withDescription("Specified redirection URI is not allowed.")
        .withState(state);
    }

    if (req.query.response_type === undefined) {
      throw new OAuthError("invalid_request").withDescription("Missing parameter response_type").withState(state);
    }

    if (!isSupportedResponseType(req.query.response_type)) {
      throw new OAuthError("unsupported_response_type")
        .withDescription("Parameter response_type has unsupported value")
        .withState(state);
    }

    const responseType = req.query.response_type;

    let scope: string[] = [];

    if (typeof req.query.scope === "string") {
      scope = req.query.scope.split(" ");

      const unknownScope = scope.find(scope => Object.keys(SCOPES).indexOf(scope) === -1);

      if (unknownScope) {
        throw new OAuthError("invalid_scope")
          .withDescription(`Scope '${unknownScope}' is not supported.`)
          .withState(state);
      }
    } else {
      throw new OAuthError("invalid_scope").withDescription("Scope parameter is malformed").withState(state);
    }

    const flowId = this.createFlow({
      service,
      state,
      scope,
      responseType,
      redirectUrl,
    });

    if (req.authorization && req.authorization.token.authenticatedTo.includes(service.serviceIdentifier)) {
      await this.grantAuthorization(req, res, {
        service,
        state,
        scope,
        responseType,
        redirectUrl,
        user: req.authorization.user,
        step: "privacy",
      });

      return;
    }

    return res.status(302).redirect(`/oauth/flow/${flowId}/login`);
  };

  private loginForm: RequestHandler = async (req, res) => {
    const { service } = this.getFlowState(req, "login");

    return res.status(200).render("login", {
      service,
      submitUrl: `/oauth/flow/${req.params.id}/login`,
      csrfToken: req.csrfToken(),
    });
  };

  private handleLogin: RequestHandler = async (req, res) => {
    const { username, password } = req.body;
    const flow = this.getFlowState(req, "login");

    let user;

    try {
      user = await UserService.getUserWithUsernameAndPassword(username, password);
    } catch {
      return res.status(200).render("login", {
        service: flow.service,
        csrfToken: req.csrfToken(),
        submitUrl: `/oauth/flow/${req.params.id}/login`,
        errors: ["Invalid credentials."],
      });
    }

    this.setFlowState(req, {
      ...flow,
      user,
      step: "privacy",
    });

    return res.status(302).redirect(`/oauth/flow/${req.params.id}/privacy`);
  };

  private privacyForm: RequestHandler = async (req, res) => {
    const flow = this.getFlowState(req, "privacy");
    const { user, service } = flow;

    const consent = await ConsentService.findByUserAndService(user.id, service.id);

    if (consent?.consent === PrivacyPolicyConsent.Accepted) {
      this.setFlowState(req, {
        ...flow,
        step: "gdpr",
      });

      return res.status(302).redirect(`/oauth/flow/${req.params.id}/gdpr`);
    }

    const policy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);

    return res.render("privacypolicy", {
      serviceDisplayName: service.displayName,
      policy: policy.text,
      policyUpdateDate: moment(policy.modified).format("DD.MM.YYYY HH:mm"),
      csrfToken: req.csrfToken(),
      submitUrl: `/oauth/flow/${req.params.id}/privacy`,
    });
  };

  private handlePrivacy: RequestHandler = async (req, res) => {
    const flow = this.getFlowState(req, "privacy");
    const { user, service, state } = flow;

    if (!req.body.accept) {
      try {
        await ConsentService.declineConsent(user.id, service.id);

        throw new OAuthError("access_denied")
          .withDescription("User did not accept the service privacy policy.")
          .withState(state);
      } catch {
        throw new OAuthError("server_error")
          .withDescription("Failed to save privacy policy consent information.")
          .withState(state);
      }
    } else {
      try {
        await ConsentService.acceptConsent(user.id, service.id);
      } catch {
        throw new OAuthError("server_error")
          .withDescription("Failed to save privacy policy consent information.")
          .withState(state);
      }
    }

    this.setFlowState(req, {
      ...flow,
      step: "gdpr",
    });

    return res.status(302).redirect(`/oauth/flow/${req.params.id}/gdpr`);
  };

  private async grantAuthorization(req: Request, res: Response, flow: Extract<FlowState, { user: User }>) {
    const { service, state, user, scope, responseType } = flow;

    const code = Math.random().toString(16).slice(2);

    this.codes.set(code, { service, user, scope });

    const url = new URL(service.redirectUrl);

    if (state) {
      url.searchParams.set("state", state);
    }

    let token;

    if (req.cookies.token) {
      const parsedToken = stringToServiceToken(req.cookies.token);

      if (parsedToken.userId === user.id) {
        token = parsedToken;
      }
    }

    if (token) {
      token = AuthenticationService.appendNewServiceAuthenticationToToken(token, service.serviceIdentifier).toString();
    } else {
      token = AuthenticationService.createToken(user.id, [service.serviceIdentifier]);
    }

    if (responseType === "code") {
      url.searchParams.set("code", code);
    } else if (responseType === "token") {
      url.searchParams.set("access_token", token);
      url.searchParams.set("token_type", "bearer");
    } else if (responseType === "id_token") {
      const key = await this.getOpenIDPrivateKey();
      const token = getIdToken(user, scope, service, key);

      url.searchParams.set("access_token", "asd");
      url.searchParams.set("token_type", "bearer");
      url.searchParams.set("id_token", token);
    }

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN,
    });

    return res.status(302).redirect(url.toString());
  }

  private gdprForm: RequestHandler = async (req, res) => {
    const flow = this.getFlowState(req, "gdpr");
    const { service, scope, user } = flow;

    const claimKeys = mapClaimsToUserProperties(getClaimNames(scope));

    const keys = (Object.keys(removeNonRequestedData(user, service.dataPermissions | 512 | 1)) as Array<keyof User>)
      .filter(key => claimKeys.includes(key))
      .map((key: keyof User) => ({
        name: key,
        value: user[key].toString(),
      }));

    return res.status(200).render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect ?? service.redirectUrl,
      submitUrl: `/oauth/flow/${req.params.id}/gdpr`,
    });
  };

  private handleGdpr: RequestHandler = async (req, res) => {
    const flow = this.getFlowState(req, "gdpr");

    if (req.body.permission === "yes") {
      await this.grantAuthorization(req, res, flow);
    } else {
      throw new OAuthError("access_denied")
        .withDescription("User denied the authorization request.")
        .withState(flow.state);
    }
  };

  private getFlowState = <S extends FlowState["step"]>(req: Request, step: S): Extract<FlowState, { step: S }> => {
    if (!req.params.id) {
      throw new ServiceError(500, "Internal Server Error");
    }

    const flowState = this.flows.get(req.params.id);

    if (flowState === undefined) {
      throw new ServiceError(400, "Invalid flow ID");
    }

    if (flowState.step !== step) {
      throw new ServiceError(400, "Unexpected flow step");
    }

    return flowState as Extract<FlowState, { step: S }>;
  };

  private setFlowState = (req: Request, state: FlowState) => {
    this.flows.set(req.params.id, state);
  };

  private requireClientAuthentication(): RequestHandler {
    return async (req, _res, next) => {
      let serviceIdentifier;
      let serviceSecret;

      if (req.headers.authorization) {
        const [scheme, value] = req.headers.authorization.split(" ", 2);

        if (scheme !== "Basic") {
          throw new ServiceError(400, `HTTP authentication scheme "${scheme}" not supported`);
        }

        [serviceIdentifier, serviceSecret] = Buffer.from(value, "base64").toString().split(":", 2);
      } else if (req.body.client_id && req.body.client_secret) {
        serviceIdentifier = req.body.client_id;
        serviceSecret = req.body.client_secret;
      } else {
        throw new ServiceError(403, "Client authentication required");
      }

      let service;

      try {
        service = await AuthenticationService.getServiceWithIdentifier(serviceIdentifier);
      } catch {
        throw new ServiceError(403, "Invalid client credentials");
      }

      if (serviceSecret !== service.secret) {
        throw new ServiceError(403, "Invalid client credentials");
      }

      req.service = service;

      next();
    };
  }

  private token: RequestHandler = async (req, res) => {
    const body = req.body;
    let user;
    let scope: string[] = [];

    if (body.grant_type === "authorization_code") {
      const ctx = this.codes.get(body.code);

      if (!ctx) {
        throw new OAuthError("invalid_request");
      }

      this.codes.delete(body.code);

      if (ctx.service.serviceIdentifier !== req.service.serviceIdentifier) {
        throw new OAuthError("unauthorized_client");
      }

      if (body.redirect_uri !== ctx.service.redirectUrl) {
        throw new OAuthError("invalid_request").withDescription("Provided redirection URI is wrong.");
      }

      user = ctx.user;
      scope = ctx.scope;
    } else if (body.grant_type === "password") {
      if (!body.username || !body.password) {
        throw new OAuthError("invalid_request").withDescription(
          'Parameters "username" and "password" are required for grant type "password".',
        );
      }

      try {
        user = await UserService.getUserWithUsernameAndPassword(body.username, body.password);
      } catch {
        throw new OAuthError("access_denied");
      }

      if (body.scope && typeof body.scope === "string") {
        scope = body.scope.split(" ");
      }
    } else {
      throw new OAuthError("invalid_request").withDescription(`Grant type "${body.grant_type}" is not supported.`);
    }

    const key = await this.getOpenIDPrivateKey();
    const token = getIdToken(user, scope, req.service, key);

    return res.status(200).json({
      access_token: AuthenticationService.createToken(user.id, [req.service.serviceIdentifier]),
      token_type: "bearer",
      id_token: token,
    });
  };

  private jsonErrorHandler: ErrorRequestHandler = async (err, _req, res, _next) => {
    console.log(err);

    const error: OAuthError =
      err instanceof OAuthError ? err : new OAuthError("server_error").withDescription("Internal server error");

    res.status(error.statusCode).json({
      error: error.options.code,
      error_description: error.options.description,
      error_uri: error.options.uri,
      state: error.options.state,
    });
  };

  private redirectErrorHandler: ErrorRequestHandler = async (err, req, res, _next) => {
    console.log(err);

    let state;
    let redirectUrl;

    if (req.params.id) {
      const flow = this.flows.get(req.params.id);

      if (!flow) {
        res.status(404).render("serviceError", {
          error: `Invalid flow ID`,
        });

        return;
      }

      state = flow.state;
      redirectUrl = flow.redirectUrl;
    } else {
      const service = await extractService(req);

      state = req.query.state ? String(req.query.state) : null;
      redirectUrl = req.query.redirect_uri;

      if (redirectUrl !== service.redirectUrl) {
        res.status(400).render("serviceError", {
          error: `Invalid redirection URI.`,
        });

        return;
      }
    }

    const error: OAuthError =
      err instanceof OAuthError
        ? err
        : new OAuthError("server_error").withDescription("Internal server error").withState(state);

    const target = new URL(redirectUrl);

    target.searchParams.set("error", error.options.code);

    if (error.options.uri) {
      target.searchParams.set("error_uri", error.options.uri);
    }

    if (error.options.description) {
      target.searchParams.set("error_description", error.options.description);
    }

    if (error.options.state) {
      target.searchParams.set("state", error.options.state);
    }

    res.status(302).redirect(target.toString());
  };

  private discovery: RequestHandler = (_req, res) => {
    res.status(200).json({
      issuer: process.env.ISSUER_ID,
      authorization_endpoint: `${process.env.PUBLIC_URL}/oauth/authorize`,
      token_endpoint: `${process.env.PRIVATE_URL}/oauth/token`,
      jwks_uri: `${process.env.PRIVATE_URL}/oauth/jwks.json`,
      scopes_supported: Object.keys(SCOPES),
      response_types_supported: SUPPORTED_RESPONSE_TYPES,
      token_endpoint_auth_methods_supported: ["client_secret_basic"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"], // RS256
    });
  };

  private jwks: RequestHandler = async (_req, res) => {
    const key = await this.getOpenIDPrivateKey();

    res.status(200).json({
      keys: [key.toJSON()],
    });
  };

  public createDiscoveryRoute(): RequestHandler {
    return this.discovery.bind(this);
  }

  public createRoutes(): Router {
    const authorizationFlowRouter = Router();
    const backChannelRouter = Router();

    authorizationFlowRouter.get(
      "/authorize",
      AuthorizeMiddleware.loadToken,
      this.auth as RequestHandler,
      this.redirectErrorHandler,
    );

    authorizationFlowRouter.get("/flow/:id/login", this.csrfMiddleware, this.loginForm, this.redirectErrorHandler);

    authorizationFlowRouter.post("/flow/:id/login", this.csrfMiddleware, this.handleLogin, this.redirectErrorHandler);

    authorizationFlowRouter.get("/flow/:id/privacy", this.csrfMiddleware, this.privacyForm, this.redirectErrorHandler);

    authorizationFlowRouter.post(
      "/flow/:id/privacy",
      this.csrfMiddleware,
      this.handlePrivacy,
      this.redirectErrorHandler,
    );

    authorizationFlowRouter.get("/flow/:id/gdpr", this.csrfMiddleware, this.gdprForm, this.redirectErrorHandler);

    authorizationFlowRouter.post("/flow/:id/gdpr", this.csrfMiddleware, this.handleGdpr, this.redirectErrorHandler);

    backChannelRouter.post("/token", this.requireClientAuthentication(), this.token);

    backChannelRouter.use(this.jsonErrorHandler);

    this.route.use(backChannelRouter);
    this.route.use(authorizationFlowRouter);

    this.route.use("/jwks.json", this.jwks.bind(this));

    return this.route;
  }
}

export default new OAuthController();

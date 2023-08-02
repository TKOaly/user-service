import express, { NextFunction, Request, RequestHandler, Response } from "express";
import JWT from "jsonwebtoken";
import csrf from "csurf";
import moment from "moment";
import Controller from "../interfaces/Controller";
import Service from "../models/Service";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import PrivacyPolicyService from "../services/PrivacyPolicyService";
import UserService from "../services/UserService";
import { pick } from "lodash";
import ServiceError from "../utils/ServiceError";
import { stringToServiceToken } from "../token/Token";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ConsentService from "../services/ConsentService";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import { OAuthError } from "../utils/OAuthError";

const getIdToken = (user: User, scope: string[], service: Service) => {
  const claimNames = getClaimNames(scope);
  const claims = pick(getUserClaims(user, claimNames), getAllowedClaims(service.dataPermissions));

  const iat = Date.now();

  const token = {
    iss: "http://users.tko-aly.localhost/",
    aud: service.serviceIdentifier,
    iat,
    // Three hours
    exp: Date.now() + 1000 * 60 * 60 * 3,
    ...claims,
  };

  return JWT.sign(token, process.env.JWT_SECRET ?? "");
};

type ResponseType = "code" | "token" | "id_token";

function isSupportedResponseType(value: unknown): value is ResponseType {
  return typeof value === "string" && ["code", "token", "id_token"].indexOf(value) !== -1;
}

const SCOPES: Record<string, string[]> = {
  openid: ["iss", "aud", "sub", "exp", "iat"],
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
};

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
};

const mapClaimsToUserProperties = (claims: string[]) =>
  claims.flatMap((claim: string) => CLAIM_TO_PROPERTY_MAP[claim] ?? []);

const CLAIMS = [
  ["sub"],
  ["preferred_username", "username"],
  ["name"],
  ["nickname"],
  ["email"],
  ["residence"],
  ["phone"],
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
];

const getAllowedClaims = (permissions: number) =>
  CLAIMS.flatMap((claims, i) => (Math.pow(2, i) & permissions ? claims : []));

type FlowStateLogin = {
  service: Service;
  state: string | null;
  scope: string[];
  responseType: "token" | "code" | "id_token";
  redirectUrl: string;
  step: "login";
};

type FlowStateGdpr = Omit<FlowStateLogin, "step"> & { step: "gdpr" };
type FlowStatePrivacy = Omit<FlowStateGdpr, "step"> & { step: "privacy"; user: User };

type FlowState = FlowStateLogin | FlowStateGdpr | FlowStatePrivacy;

interface RequestWithFlowState<S extends string> extends Request {
  flow: Extract<FlowState, { step: S }>;
  updateFlow: (state: FlowState) => void;
}

interface RequestWithService extends Request {
  service: Service;
}

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
  } catch (err) {
    throw new OAuthError("invalid_request").withDescription(`Unknown client ID '${client_id}'.`);
  }
};

class OAuthController implements Controller {
  private route: express.Router;
  private flows: Map<string, FlowState> = new Map();
  private codes: Map<string, AuthorizationCodeContext> = new Map();
  public csrfMiddleware: express.RequestHandler;

  constructor() {
    this.route = express.Router();

    this.csrfMiddleware = csrf({
      cookie: true,
    });
  }

  private createFlow(options: FlowInitOptions): string {
    const id = Math.random().toString(16).slice(2);

    this.flows.set(id, {
      ...options,
      step: "login",
    });

    return id;
  }

  private async auth(req: Request & IASRequest, res: Response) {
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
  }

  private async loginForm(req: RequestWithFlowState<"login">, res: Response) {
    const { service } = req.flow;

    return res.status(200).render("login", {
      service,
      submitUrl: "/login",
      csrfToken: req.csrfToken(),
    });
  }

  private async handleLogin(req: RequestWithFlowState<"login">, res: Response) {
    const { username, password } = req.body;
    const { service } = req.flow;

    let user;

    try {
      user = await UserService.getUserWithUsernameAndPassword(username, password);
    } catch (err) {
      return res.status(200).render("login", {
        service,
        csrfToken: req.csrfToken(),
        errors: ["Invalid credentials."],
      });
    }

    req.updateFlow({
      ...req.flow,
      user,
      step: "privacy",
    });

    return res.status(302).redirect(`/oauth/flow/${req.params.id}/privacy`);
  }

  private async privacyForm(req: RequestWithFlowState<"privacy">, res: Response) {
    const { user, service } = req.flow;

    const consent = await ConsentService.findByUserAndService(user.id, service.id);

    if (consent?.consent === PrivacyPolicyConsent.Accepted) {
      req.updateFlow({
        ...req.flow,
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
      submitUrl: `/api/oidc/flow/${req.params.id}/privacy`,
    });
  }

  private async handlePrivacy(req: RequestWithFlowState<"privacy">, res: Response) {
    const { user, service, state } = req.flow;

    if (!req.body.accept) {
      try {
        await ConsentService.declineConsent(user.id, service.id);

        throw new OAuthError("access_denied")
          .withDescription("User did not accept the service privacy policy.")
          .withState(state);
      } catch (ex) {
        throw new OAuthError("server_error")
          .withDescription("Failed to save privacy policy consent information.")
          .withState(state);
      }
    } else {
      try {
        await ConsentService.acceptConsent(user.id, service.id);
      } catch (ex) {
        throw new OAuthError("server_error")
          .withDescription("Failed to save privacy policy consent information.")
          .withState(state);
      }
    }

    req.updateFlow({
      ...req.flow,
      step: "gdpr",
    });

    return res.status(302).redirect(`/oauth/flow/${req.params.id}/gdpr`);
  }

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
      const token = getIdToken(user, scope, service);

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

  private async gdprForm(req: RequestWithFlowState<"privacy">, res: Response) {
    const { service, scope, user } = req.flow;

    const claimKeys = mapClaimsToUserProperties(getClaimNames(scope));

    const keys = (Object.keys(user.removeNonRequestedData(service.dataPermissions | 512 | 1)) as Array<keyof User>)
      .filter(key => claimKeys.includes(key))
      .map((key: keyof User) => ({
        name: key,
        value: user[key].toString(),
      }));

    return res.status(200).render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl,
    });
  }

  private async handleGdpr(req: RequestWithFlowState<"privacy">, res: Response) {
    if (req.body.permission === "yes") {
      await this.grantAuthorization(req, res, req.flow);
    } else {
      throw new OAuthError("access_denied")
        .withDescription("User denied the authorization request.")
        .withState(req.flow.state);
    }
  }

  private assertFlowStep(step: string): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.params.id) {
        return res.status(500).render("serviceError", {
          error: "Internal Server Error",
        });
      }

      const flowState = this.flows.get(req.params.id);

      if (flowState === undefined) {
        return res.status(400).render("serviceError", {
          error: "Invalid flow ID",
        });
      }

      if (flowState.step !== step) {
        return res.status(400).render("serviceError", {
          error: "Unexpected flow step",
        });
      }

      Object.assign(req, {
        flow: flowState,

        updateFlow: (state: FlowState) => this.flows.set(req.params.id, state),
      });

      next();
    };
  }

  private requireClientAuthentication(): RequestHandler {
    return async (req, res, next) => {
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
      } catch (err) {
        throw new ServiceError(403, "Invalid client credentials");
      }

      if (serviceSecret !== service.secret) {
        throw new ServiceError(403, "Invalid client credentials");
      }

      (req as any).service = service;

      next();
    };
  }

  private async token(req: RequestWithService, res: Response) {
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
      } catch (err) {
        throw new OAuthError("access_denied");
      }

      if (body.scope && typeof body.scope === "string") {
        scope = body.scope.split(" ");
      }
    } else {
      throw new OAuthError("invalid_request").withDescription(`Grant type "${body.grant_type}" is not supported.`);
    }

    const token = getIdToken(user, scope, req.service);

    return res.status(200).json({
      access_token: AuthenticationService.createToken(user.id, [req.service.serviceIdentifier]),
      token_type: "bearer",
      id_token: token,
    });
  }

  private async jsonErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
    const error: OAuthError =
      err instanceof OAuthError ? err : new OAuthError("server_error").withDescription("Internal server error");

    res.status(error.statusCode).json({
      error: error.options.code,
      error_descrpition: error.options.description,
      error_uri: error.options.uri,
      state: error.options.state,
    });
  }

  private async redirectErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
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
      target.searchParams.set("error_descrpition", error.options.description);
    }

    if (error.options.state) {
      target.searchParams.set("state", error.options.state);
    }

    res.status(302).redirect(target.toString());
  }

  public createRoutes(): express.Router {
    const authorizationFlowRouter = express.Router();
    const backChannelRouter = express.Router();

    authorizationFlowRouter.get(
      "/authorize",
      AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware) as any,
      this.auth.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.get(
      "/flow/:id/login",
      this.assertFlowStep("login"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.loginForm.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.post(
      "/flow/:id/login",
      this.assertFlowStep("login"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.handleLogin.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.get(
      "/flow/:id/privacy",
      this.assertFlowStep("privacy"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.privacyForm.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.post(
      "/flow/:id/privacy",
      this.assertFlowStep("privacy"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.handlePrivacy.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.get(
      "/flow/:id/gdpr",
      this.assertFlowStep("gdpr"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.gdprForm.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    authorizationFlowRouter.post(
      "/flow/:id/gdpr",
      this.assertFlowStep("gdpr"),
      this.csrfMiddleware.bind(this.csrfMiddleware),
      this.handleGdpr.bind(this) as any,
      this.redirectErrorHandler.bind(this),
    );

    backChannelRouter.post("/token", this.requireClientAuthentication(), this.token.bind(this) as any);

    backChannelRouter.use(this.jsonErrorHandler.bind(this));

    this.route.use(backChannelRouter);
    this.route.use(authorizationFlowRouter);

    return this.route;
  }
}

export default new OAuthController();

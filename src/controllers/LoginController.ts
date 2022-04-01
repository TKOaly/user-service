import csrf from "csurf";
import { Router } from "express";
import * as express from "express";
import moment from "moment";
import * as Sentry from "@sentry/node";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import Controller from "../interfaces/Controller";
import Service from "../models/Service";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import ConsentService from "../services/ConsentService";
import PrivacyPolicyService from "../services/PrivacyPolicyService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest, LoginStep } from "../utils/AuthorizeMiddleware";
import cachingMiddleware from "../utils/CachingMiddleware";
import ServiceResponse from "../utils/ServiceResponse";

class LoginController implements Controller {
  public route: Router;

  public csrfMiddleware: express.RequestHandler;

  constructor() {
    this.route = Router();
    this.csrfMiddleware = csrf({
      cookie: true,
    });
  }

  public async getLoginView(
    req: express.Request & IASRequest,
    res: express.Response,
  ): Promise<express.Response | void> {
    // Delete login step
    if (req.session && req.session.loginStep) {
      req.session.loginStep = undefined;
    }

    // Delete keys
    if (req.session && req.session.keys) {
      req.session.keys = [];
    }

    // Delete user
    if (req.session && req.session.user) {
      req.session.user = undefined;
    }

    if (!req.query.serviceIdentifier) {
      return res.status(400).render("serviceError", {
        error: "Missing service identifier",
      });
    }

    try {
      const service = await AuthenticationService.getServiceWithIdentifier(req.query.serviceIdentifier as string);

      if (req.authorization) {
        if (req.authorization.token.authenticatedTo.indexOf(service.serviceIdentifier) > -1) {
          return res.redirect(service.redirectUrl);
        }
      }

      return res.render("login", {
        service,
        loggedUser: req.authorization ? req.authorization.user.username : null,
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken(),
      });
    } catch (err) {
      Sentry.captureException(err);
      return res.status(400).render("serviceError", {
        error: err.message,
      });
    }
  }

  /**
   * Sets the language of the page.
   */
  public setLanguage(req: IASRequest, res: express.Response) {
    res.clearCookie("tkoaly_locale");
    res.cookie("tkoaly_locale", req.params.language, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN,
    });
    return res.redirect(req.params.serviceIdentifier ? "/?serviceIdentifier=" + req.params.serviceIdentifier : "/");
  }

  public async logOut(req: express.Request & IASRequest, res: express.Response): Promise<express.Response | void> {
    if (!req.query.serviceIdentifier) {
      return res.status(400).render("serviceError", {
        error: "Missing service identifier",
      });
    }

    if (req.query.serviceIdentifier === "*" && req.query.redirect) {
      res.clearCookie("token");
      return res.redirect(req.query.redirect as string);
    }

    let service: Service;
    try {
      service = await AuthenticationService.getServiceWithIdentifier(req.query.serviceIdentifier as string);
    } catch (e) {
      Sentry.captureException(e);
      return res.status(e.httpStatusCode || 500).render("serviceError", {
        error: e.message,
      });
    }

    const token = AuthenticationService.removeServiceAuthenticationToToken(
      req.authorization.token,
      service.serviceIdentifier,
    );

    // this token had one service left which was remove -> clear token
    if (req.authorization.token.authenticatedTo.length === 1) {
      res.clearCookie("token", { domain: process.env.COOKIE_DOMAIN });
    } else {
      res.cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        domain: process.env.COOKIE_DOMAIN,
      });
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");

    return res.render("logout", { serviceName: service.displayName });
  }

  public async login(req: express.Request & IASRequest, res: express.Response): Promise<express.Response | void> {
    if (!req.body.serviceIdentifier || !req.body.username || !req.body.password) {
      return res.status(400).json(new ServiceResponse(null, "Invalid request params"));
    }

    let service: Service;
    try {
      service = await AuthenticationService.getServiceWithIdentifier(req.body.serviceIdentifier as string);
    } catch (e) {
      return res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }

    if (req.authorization) {
      if (req.authorization.token.authenticatedTo.indexOf(req.body.serviceIdentifier) > -1) {
        return res.redirect(service.redirectUrl);
      }
    }

    let keys: Array<{ name: string; value: string }> = [];
    let user: User;
    try {
      user = await UserService.getUserWithUsernameAndPassword(req.body.username, req.body.password);

      if (req.authorization && req.authorization.user) {
        if (user.id !== req.authorization.user.id) {
          return res.status(403).json(new ServiceResponse(null, "Credentials not matching already authorized user"));
        }
      } else {
        // Something is missing here..?
      }
    } catch (e) {
      return res.status(500).render("login", {
        service,
        errors: [e.message],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken(),
      });
    }

    // Removes data that are not needed when making a request
    // We require user id and role every time, regardless of permissions in services
    // @ts-expect-error
    keys = Object.keys(user.removeNonRequestedData(service.dataPermissions | 512 | 1)).map((key: keyof User) => ({
      name: key,
      value: user[key].toString(),
    }));

    // Set session
    if (!user.id) {
      return res.status(500).render("login", {
        service,
        errors: ["Authentication failure: User ID is undefined."],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken(),
      });
    }

    if (req.session === undefined) {
      Sentry.captureException(new Error("Session is undefined."));
      return res.status(500).render("login", {
        service,
        errors: ["Authentication failure: Session is undefined."],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken(),
      });
    }

    req.session.user = {
      userId: user.id,
      username: req.body.username,
      password: req.body.password,
      serviceIdentifier: service.serviceIdentifier,
      // Check for custom redirection url
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl,
    };

    // Consent check here. If status is unknown, declined or the consent doesn't exist, redirect.
    try {
      const consent = await ConsentService.findByUserAndService(user.id, service.id);
      if (
        !consent ||
        consent.consent === PrivacyPolicyConsent.Declined ||
        consent.consent === PrivacyPolicyConsent.Unknown
      ) {
        const policy = await PrivacyPolicyService.findByServiceIdentifier(service.serviceIdentifier);
        // Redirect to consent page
        // Login step detects that in what part the login process currently is
        req.session.loginStep = LoginStep.PrivacyPolicy;
        req.session.keys = keys;
        return res.render("privacypolicy", {
          serviceDisplayName: service.displayName,
          policy: policy.text,
          policyUpdateDate: moment(policy.modified).format("DD.MM.YYYY HH:mm"),
          csrfToken: req.csrfToken(),
        });
      }
    } catch (err) {
      Sentry.captureException(err);
      return res.status(500).render("login", {
        service,
        errors: [err.message],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken(),
      });
    }
    // Set login step
    req.session.loginStep = LoginStep.GDPR;
    // Render GDPR template, that shows required personal information.
    return res.render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl,
    });
  }

  /**
   * Handles GDPR template and redirects the user forward
   */
  public async loginConfirm(
    req: express.Request & IASRequest,
    res: express.Response,
  ): Promise<express.Response | void> {
    const body: {
      permission: string;
    } = req.body;

    if (!body.permission) {
      return res.redirect("https://members.tko-aly.fi");
    }

    if (req.session === undefined) {
      Sentry.captureException(new Error("Session is undefined"));
      return res.status(500).render("serviceError", {
        error: "Server error",
      });
    }

    if (req.session.loginStep !== LoginStep.GDPR) {
      Sentry.captureException(new Error("Invalid login step"));
      return res.status(500).render("serviceError", {
        error: "Server error",
      });
    }

    let token: string;

    try {
      if (req.session.user === undefined) {
        throw new Error("Session user is undefined.");
      }

      if (req.authorization) {
        token = AuthenticationService.appendNewServiceAuthenticationToToken(
          req.authorization.token,
          req.session.user.serviceIdentifier,
        );
      } else {
        token = AuthenticationService.createToken(req.session.user.userId, [req.session.user.serviceIdentifier]);
      }
    } catch (e) {
      Sentry.captureException(e);
      return res.status(500).json(new ServiceResponse(null, e.message));
    }

    const redirectTo: string = req.session.user.redirectTo;
    req.session.user = undefined;
    req.session.keys = [];
    req.session.loginStep = undefined;

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN,
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");
    return res.redirect(redirectTo);
  }

  /**
   * Handles privacy policy confirmation.
   */
  public async privacyPolicyConfirm(
    req: express.Request & IASRequest,
    res: express.Response,
  ): Promise<express.Response | void> {
    const body: {
      accept: string;
    } = req.body;

    if (req.session === undefined) {
      Sentry.captureException(new Error("Session is undefined."));
      return res.status(500).render("serviceError", {
        error: "Server error",
      });
    }

    if (req.session.user === undefined) {
      Sentry.captureException(new Error("Session user is undefined."));
      return res.status(500).render("serviceError", {
        error: "Server error",
      });
    }

    if (req.session.loginStep !== LoginStep.PrivacyPolicy) {
      Sentry.captureException(new Error("Invalid login step"));
      return res.status(500).render("serviceError", {
        error: "Server error",
      });
    }

    const service = await AuthenticationService.getServiceWithIdentifier(req.session.user.serviceIdentifier);

    if (!body.accept) {
      // Add new consent
      try {
        await ConsentService.declineConsent(req.session.user.userId, service.id);
        return res.redirect("https://members.tko-aly.fi");
      } catch (ex) {
        Sentry.captureException(ex);
        return res.status(500).render("serviceError", {
          error: "Error saving your answer." + ex.message,
        });
      }
    } else {
      try {
        await ConsentService.acceptConsent(req.session.user.userId, service.id);
      } catch (ex) {
        Sentry.captureException(ex);
        return res.status(500).render("serviceError", {
          error: "Error saving your answer: " + ex.message,
        });
      }
    }
    req.session.loginStep = LoginStep.GDPR;
    // Render GDPR template, that shows required personal information.
    return res.render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: req.session.keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl,
    });
  }

  public createRoutes(): express.Router {
    this.route.get(
      "/",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware, // @ts-expect-error
      AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware),
      this.getLoginView.bind(this),
    );
    this.route.post(
      "/login",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware, // @ts-expect-error
      AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware),
      this.login.bind(this),
    );
    this.route.post(
      "/privacypolicy_confirm",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware, // @ts-expect-error
      AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware),
      this.privacyPolicyConfirm.bind(this),
    );
    this.route.post(
      "/login_confirm",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware, // @ts-expect-error
      AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware),
      this.loginConfirm.bind(this),
    ); // @ts-expect-error
    this.route.get("/logout", AuthorizeMiddleware.authorize(false).bind(AuthorizeMiddleware), this.logOut.bind(this)); // @ts-expect-error
    this.route.get("/lang/:language/:serviceIdentifier?", this.setLanguage.bind(this.setLanguage));
    return this.route;
  }
}

export interface ISessionUser {
  userId: number;
  username: string;
  password: string;
  serviceIdentifier: string;
  redirectTo: string;
}

export default new LoginController();

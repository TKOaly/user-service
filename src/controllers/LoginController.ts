import { Router } from "express";
import * as express from "express";
import moment from "moment";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IController from "../interfaces/IController";
import Consent from "../models/Consent";
import PrivacyPolicy from "../models/PrivacyPolicy";
import Service from "../models/Service";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import ConsentService from "../services/ConsentService";
import PrivacyPolicyService from "../services/PrivacyPolicyService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, {
  IASRequest,
  LoginStep
} from "../utils/AuthorizeMiddleware";
import cachingMiddleware from "../utils/CachingMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import csrf from "csurf";

/**
 * Login controller.
 *
 * @export
 * @class LoginController
 * @implements {IController}
 */
export default class LoginController implements IController {
  /**
   * Router.
   *
   * @type {Router}
   * @memberof LoginController
   */
  public route: Router;
  /**
   * Authorization middleware.
   *
   * @type {AuthorizeMiddleware}
   * @memberof LoginController
   */
  public authorizationMiddleware: AuthorizeMiddleware;

  public csrfMiddleware: express.RequestHandler;

  /**
   * Creates an instance of LoginController.
   * @param {AuthenticationService} authService
   * @param {UserService} userService
   * @memberof LoginController
   */
  constructor(
    private authService: AuthenticationService,
    private userService: UserService,
    private consentService: ConsentService,
    private privacyPolicyService: PrivacyPolicyService
  ) {
    this.route = Router();
    this.authorizationMiddleware = new AuthorizeMiddleware(this.userService);
    this.csrfMiddleware = csrf({
      cookie: true
    });
  }

  /**
   * Returns the login view.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns {(Promise<express.Response | void>)}
   * @memberof LoginController
   */
  public async getLoginView(
    req: express.Request & IASRequest,
    res: express.Response
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
        error: "Missing service identifier"
      });
    }

    try {
      const service: Service = await this.authService.getServiceWithIdentifier(
        req.query.serviceIdentifier
      );

      if (req.authorization) {
        if (
          req.authorization.token.authenticatedTo.indexOf(
            service.serviceIdentifier
          ) > -1
        ) {
          return res.redirect(service.redirectUrl);
        }
      }

      return res.render("login", {
        service,
        loggedUser: req.authorization ? req.authorization.user.username : null,
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken()
      });
    } catch (err) {
      return res.status(400).render("serviceError", {
        error: err.message
      });
    }
  }

  /**
   * Sets the language of the page.
   *
   * @param {(Express.Request & IASRequest)} req
   * @param {(Express.Response & any)} res
   * @returns {(Promise<express.Response | void>)}
   * @memberof LoginController
   */
  public setLanguage(
    req: Express.Request & IASRequest,
    res: Express.Response & any
  ): Promise<express.Response | void> {
    res.clearCookie("tkoaly_locale");
    res.cookie("tkoaly_locale", req.params.language, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN
    });
    return res.redirect(req.params.serviceIdentifier ? "/?serviceIdentifier=" + req.params.serviceIdentifier : "/");
  }

  /**
   * Logs the user out.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof LoginController
   */
  public async logOut(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response | void> {
    if (!req.query.serviceIdentifier) {
      return res.status(400).render("serviceError", {
        error: "Missing service identifier"
      });
    }

    if (req.query.serviceIdentifier === "*" && req.query.redirect) {
      res.clearCookie("token");
      return res.redirect(req.query.redirect);
    }

    let service: Service;
    try {
      service = await this.authService.getServiceWithIdentifier(
        req.query.serviceIdentifier
      );
    } catch (e) {
      return res.status(e.httpStatusCode || 500).render("serviceError", {
        error: e.message
      });
    }

    const token: string = this.authService.removeServiceAuthenticationToToken(
      req.authorization.token,
      service.serviceIdentifier
    );

    // this token had one service left which was remove -> clear token
    if (req.authorization.token.authenticatedTo.length === 1) {
      res.clearCookie("token");
    } else {
      res.cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        domain: process.env.COOKIE_DOMAIN
      });
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");

    return res.render("logout", { serviceName: service.displayName });
  }

  /**
   * Logs the user in.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof LoginController
   */
  public async login(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response | void> {
    if (
      !req.body.serviceIdentifier ||
      !req.body.username ||
      !req.body.password
    ) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "Invalid request params"));
    }

    let service: Service;
    try {
      service = await this.authService.getServiceWithIdentifier(
        req.body.serviceIdentifier
      );
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    if (req.authorization) {
      if (
        req.authorization.token.authenticatedTo.indexOf(
          req.body.serviceIdentifier
        ) > -1
      ) {
        return res.redirect(service.redirectUrl);
      }
    }

    let keys: Array<{ name: string; value: string }> = [];
    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(
        req.body.username,
        req.body.password
      );

      if (req.authorization && req.authorization.user) {
        if (user.id !== req.authorization.user.id) {
          return res
            .status(403)
            .json(
              new ServiceResponse(
                null,
                "Credentials not matching already authorized user"
              )
            );
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
        csrfToken: req.csrfToken()
      });
    }

    // Removes data that are not needed when making a request
    // We require user id and role every time, regardless of permissions in services
    keys = Object.keys(
      user.removeNonRequestedData(service.dataPermissions | 512 | 1)
    ).map((key: keyof User) => ({ name: key, value: user[key].toString() }));

    // Set session
    if (!user.id) {
      return res.status(500).render("login", {
        service,
        errors: ["Authentication failure: User ID is undefined."],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken()
      });
    }

    req.session.user = {
      userId: user.id,
      username: req.body.username,
      password: req.body.password,
      serviceIdentifier: service.serviceIdentifier,
      // Check for custom redirection url
      redirectTo: req.body.loginRedirect
        ? req.body.loginRedirect
        : service.redirectUrl
    };

    // Consent check here. If status is unknown, declined or the consent doesn't exist, redirect.
    try {
      const consent: Consent = await this.consentService.findByUserAndService(
        user.id,
        service.id
      );
      if (
        !consent ||
        consent.consent === PrivacyPolicyConsent.Declined ||
        consent.consent === PrivacyPolicyConsent.Unknown
      ) {
        const policy: PrivacyPolicy = await this.privacyPolicyService.findByServiceIdentifier(
          service.serviceIdentifier
        );
        // Redirect to consent page
        // Login step detects that in what part the login process currently is
        req.session.loginStep = LoginStep.PrivacyPolicy;
        req.session.keys = keys;
        return res.render("privacypolicy", {
          serviceDisplayName: service.displayName,
          policy: policy.text,
          policyUpdateDate: moment(policy.modified).format("DD.MM.YYYY HH:mm"),
          csrfToken: req.csrfToken()
        });
      }
    } catch (err) {
      return res.status(500).render("login", {
        service,
        errors: [err.message],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined,
        currentLocale: res.getLocale(),
        csrfToken: req.csrfToken()
      });
    }
    // Set login step
    req.session.loginStep = LoginStep.GDPR;
    // Render GDPR template, that shows required personal information.
    return res.render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect
        ? req.body.loginRedirect
        : service.redirectUrl
    });
  }

  /**
   * Handles GDPR template and redirects the user forward
   *
   * @param {(express.Request | IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof LoginController
   */
  public async loginConfirm(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response | void> {
    const body: {
      permission: string;
    } =
      req.body;

    if (!body.permission) {
      return res.redirect("https://members.tko-aly.fi");
    }

    if (req.session.loginStep !== LoginStep.GDPR) {
      return res.status(500).render("serviceError", {
        error: "Server error"
      });
    }

    let token: string;

    try {
      if (req.authorization) {
        token = this.authService.appendNewServiceAuthenticationToToken(
          req.authorization.token,
          req.session.user.serviceIdentifier
        );
      } else {
        token = this.authService.createToken(req.session.user.userId, [
          req.session.user.serviceIdentifier
        ]);
      }
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }

    const redirectTo: string = req.session.user.redirectTo;
    req.session.user = null;
    req.session.keys = null;
    req.session.loginStep = null;

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");
    return res.redirect(redirectTo);
  }

  /**
   * Handles privacy policy confirmation.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns {(Promise<express.Response | void>)}
   * @memberof LoginController
   */
  public async privacyPolicyConfirm(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response | void> {
    const body: {
      accept: string;
    } =
      req.body;

    if (req.session.loginStep !== LoginStep.PrivacyPolicy) {
      return res.status(500).render("serviceError", {
        error: "Server error"
      });
    }

    const service: Service = await this.authService.getServiceWithIdentifier(
      req.session.user.serviceIdentifier
    );

    if (!body.accept) {
      // Add new consent
      try {
        await this.consentService.declineConsent(
          req.session.user.userId,
          service.id
        );
        return res.redirect("https://members.tko-aly.fi");
      } catch (ex) {
        return res.status(500).render("serviceError", {
          error: "Error saving your answer." + ex.message
        });
      }
    } else {
      try {
        await this.consentService.acceptConsent(
          req.session.user.userId,
          service.id
        );
      } catch (ex) {
        return res.status(500).render("serviceError", {
          error: "Error saving your answer: " + ex.message
        });
      }
    }
    req.session.loginStep = LoginStep.GDPR;
    // Render GDPR template, that shows required personal information.
    return res.render("gdpr", {
      csrfToken: req.csrfToken(),
      personalInformation: req.session.keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect
        ? req.body.loginRedirect
        : service.redirectUrl
    });
  }

  /**
   * Create routes for login controller.
   *
   * @returns
   * @memberof LoginController
   */
  public createRoutes(): express.Router {
    this.route.get(
      "/",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.getLoginView.bind(this)
    );
    this.route.post(
      "/login",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.login.bind(this)
    );
    this.route.post(
      "/privacypolicy_confirm",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.privacyPolicyConfirm.bind(this)
    );
    this.route.post(
      "/login_confirm",
      this.csrfMiddleware.bind(this.csrfMiddleware),
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.loginConfirm.bind(this)
    );
    this.route.get(
      "/logout",
      this.authorizationMiddleware
        .authorize(false)
        .bind(this.authorizationMiddleware),
      this.logOut.bind(this)
    );
    this.route.get(
      "/lang/:language/:serviceIdentifier?",
      this.setLanguage.bind(this.setLanguage)
    );
    return this.route;
  }
}

/**
 * Session user interface.
 *
 * @interface ISessionUser
 */
export interface ISessionUser {
  userId: number;
  username: string;
  password: string;
  serviceIdentifier: string;
  redirectTo: string;
}

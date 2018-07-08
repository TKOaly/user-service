import { Router } from "express";
import * as express from "express";
import IController from "../interfaces/IController";
import Service from "../models/Service";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import cachingMiddleware from "../utils/CachingMiddleware";
import ServiceResponse from "../utils/ServiceResponse";

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

  /**
   * Creates an instance of LoginController.
   * @param {AuthenticationService} authService
   * @param {UserService} userService
   * @memberof LoginController
   */
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {
    this.route = Router();
    this.authorizationMiddleware = new AuthorizeMiddleware(this.userService);
  }

  /**
   * Returns the login view.
   *
   * @param {(express.Request | any)} req
   * @param {express.Response} res
   * @returns {(Promise<express.Response | void>)}
   * @memberof LoginController
   */
  public async getLoginView(
    req: express.Request | any,
    res: express.Response
  ): Promise<express.Response | void> {
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
        loginRedirect: req.query.loginRedirect || undefined
      });
    } catch (err) {
      return res.status(400).render("serviceError", {
        error: err.message
      });
    }
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
    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN
    });

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
        loginRedirect: req.query.loginRedirect || undefined
      });
    }

    // Removes data that are not needed when making a request
    // We require user id and role every time, regardless of permissions in services
    keys = Object.keys(
      user.removeNonRequestedData(service.dataPermissions | 512 | 1)
    ).map((key: string) => ({ name: key, value: user[key] }));

    // Set session
    if (!user.id) {
      return res.status(500).render("login", {
        service,
        errors: ["Authentication failure: User ID is undefined."],
        logoutRedirect: "/?serviceIdentifier=" + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined
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
    } as ISessionUser;

    // Render GDPR template, that shows required personal information.
    return res.render("gdpr", {
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
   * @param {(express.Request | any)} req
   * @param {express.Response} res
   * @returns
   * @memberof LoginController
   */
  public async loginConfirm(
    req: express.Request | any,
    res: express.Response
  ): Promise<express.Response | void> {
    const body: {
      permission: string;
    } =
      req.body;

    if (!body.permission) {
      return res.redirect("https://members.tko-aly.fi");
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

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");
    return res.redirect(redirectTo);
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
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.getLoginView.bind(this)
    );
    this.route.post(
      "/login",
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.login.bind(this)
    );
    this.route.post(
      "/login_confirm",
      cachingMiddleware,
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware),
      this.loginConfirm.bind(this)
    );
    this.route.get(
      "/logout",
      this.authorizationMiddleware.authorize(false).bind(this.authorizationMiddleware),
      this.logOut.bind(this)
    );
    return this.route;
  }
}

/**
 * Session user interface.
 *
 * @interface ISessionUser
 */
interface ISessionUser {
  userId: number;
  username: string;
  password: string;
  serviceIdentifier: string;
  redirectTo: string;
}

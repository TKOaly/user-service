import * as express from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from "../utils/ServiceResponse";
import User from "../models/User";
import UserService from "../services/UserService";
import { URL } from "url";
import Service from "../models/Service";
import { IController } from "./IController";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthorizeMiddleware;

  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
  }

  async vanillaAuthenticate(req: any, res: express.Response) {
    let body: {
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
        token = this.authService.createToken(
          req.session.user.userId,
          [req.session.user.serviceIdentifier]
        );
      }
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }

    let redirectTo = req.session.user.redirectTo;
    req.session.user = null;

    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: "localhost"
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");
    res.redirect(redirectTo);
  }

  async requestPermissions(req: express.Request & IASRequest, res: express.Response) {
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
        req.authorization.token.authenticatedTo.indexOf(req.body.serviceIdentifier) >
        -1
      ) {
        return res.redirect(service.redirectUrl);
      }
    }

    let keys = [];
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
            .json(new ServiceResponse(null, 'Credentials not matching already authorized user'));
        }
      }
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    // Removes data that are not needed when making a request
    // We require user id and role every time, regardless of permissions in services
    keys = Object.keys(user.removeNonRequestedData(service.dataPermissions | 512 | 1)).map(key => ({ name: key, value: user[key] }));

    // Set session
    if(!user.id) {
      return res
      .status(500)
      .send("Authentication failure: User ID is undefined.")
    }

    req.session.user = {
      userId: user.id,
      username: req.body.username,
      password: req.body.password,
      serviceIdentifier: service.serviceIdentifier,
      // Check for custom redirection url
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl 
    };

    res.render("gdpr", {
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: req.body.loginRedirect ? req.body.loginRedirect : service.redirectUrl
    });
  }

  /**
   * Used to check authorization to a specified service
   * @param req 
   * @param res 
   */
  async check(req: express.Request & IASRequest, res: express.Response) {
    if (!req.get('service')) {
      return res
        .status(400)
        .json(new ServiceResponse(null, 'No service defined'));
    }

    if (req.authorization.token.authenticatedTo.indexOf(req.get('service')) > -1) {
      return res
        .status(200)
        .json(new ServiceResponse(null, 'Success'));
    } else {
      return res
        .status(404)
        .json(new ServiceResponse(null, 'Not authroized to service'));
    }
  }

  createRoutes() {
    this.route.post(
      "/vanillaAuthenticate",
      this.authorizeMiddleware.loadToken.bind(this.authorizeMiddleware),
      this.vanillaAuthenticate.bind(this)
    );
    this.route.post(
      "/requestPermissions",
      this.authorizeMiddleware.loadToken.bind(this.authorizeMiddleware),
      this.requestPermissions.bind(this)
    );
    this.route.get(
      '/check',
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.check.bind(this)
    );
    return this.route;
  }
}

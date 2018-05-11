import * as express from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from "../utils/ServiceResponse";
import User from "../models/User";
import UserService from "../services/UserService";
import { URL } from "url";
import Service from "../models/Service";
import { IController } from "./IController";
import bcrypt from "bcrypt";
import AuthrizaMiddleware from "../utils/AuthorizeMiddleware";

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthrizaMiddleware;

  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthrizaMiddleware(this.userService);
  }

  async vanillaAuthenticate(req: any, res: express.Response) {
    let body: {
      permission: string;
    } =
      req.body;

    if (!body.permission) {
      return res.redirect("https://members.tko-aly.fi");
    }

    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(
        req.session.user.username,
        req.session.user.password
      );
      // SHA1 to BCrypt conversion
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
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

  async requestPermissions(req: any, res: express.Response) {
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
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    Object.keys(user.removeSensitiveInformation()).forEach((key, idx) => {
      // We always need the users role so that's why we include 1024
      if (
        (Math.pow(2, idx) & (service.dataPermissions | 512)) ==
        Math.pow(2, idx)
      ) {
        keys.push({
          name: key,
          value: user[key]
        });
      }
    });

    // Set session
    req.session.user = {
      userId: user.id,
      username: req.body.username,
      password: req.body.password,
      serviceIdentifier: service.serviceIdentifier,
      redirectTo: service.redirectUrl
    };

    res.render("gdpr", {
      personalInformation: keys,
      serviceDisplayName: service.displayName,
      redirectTo: service.redirectUrl
    });
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
    return this.route;
  }
}

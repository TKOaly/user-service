import { IController } from "./IController";
import { Response, Router } from 'express';
import { AuthenticationService } from "../services/AuthenticationService";
import Service from "../models/Service";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import * as express from 'express';
import ServiceError from "../utils/ServiceError";
import ServiceResponse from "../utils/ServiceResponse";

export default class LoginController implements IController {
  route: Router;
  authorizationMiddleware: AuthorizeMiddleware;

  constructor(
    private authService: AuthenticationService, 
    private userService: UserService) {
    this.route = Router();
    this.authorizationMiddleware = new AuthorizeMiddleware(this.userService);
  }

  async getLoginView(req: any, res: Response) {
    if (!req.query.serviceIdentifier) {
      return res.status(400).send("Service identifier missing");
    }
  
    try {
      const service: Service = await this.authService.getServiceWithIdentifier(
        req.query.serviceIdentifier
      );

      if (req.authorization) {
        if (
          req.authorization.token.authenticatedTo.indexOf(service.serviceIdentifier) >
          -1
        ) {
          return res.redirect(service.redirectUrl);
        }
      }

      return res.render("login", { 
        service,
        loggedUser: req.authorization ? req.authorization.user.username : null,
        logoutRedirect: '/?serviceIdentifier=' + service.serviceIdentifier,
        loginRedirect: req.query.loginRedirect || undefined
      });
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

  async logOut(req: express.Request & IASRequest, res: express.Response) {
    if (!req.query.serviceIdentifier) {
      return res
        .status(400)
        .json(new ServiceError(null, 'No service identifier'));
    }

    if (req.query.serviceIdentifier === '*' && req.query.redirect) {
      res.clearCookie('token');
      return res.redirect(req.query.redirect);
    }

    let service: Service;
    try {
      service = await this.authService.getServiceWithIdentifier(req.query.serviceIdentifier)
    } catch(e) {
      return res
        .status(e.httpStatusCode || 500)
        .json(new ServiceResponse(null, e.message));
    }

    const token = this.authService.removeServiceAuthenticationToToken(req.authorization.token, service.serviceIdentifier);
    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: "localhost"
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Credentials", "true");
    res.render('logout', { serviceName: service.displayName });
  }

  createRoutes() {
    this.route.get(
      '/', 
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware), 
      this.getLoginView.bind(this));
    this.route.get(
      '/logout',
      this.authorizationMiddleware.authorize.bind(this.authorizationMiddleware),
      this.logOut.bind(this)
    );
    return this.route;
  }
}
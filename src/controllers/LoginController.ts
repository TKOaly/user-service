import { IController } from "./IController";
import { Response, Router } from 'express';
import { AuthenticationService } from "../services/AuthenticationService";
import Service from "../models/Service";
import UserService from "../services/UserService";
import AuthrizaMiddleware from "../utils/AuthorizeMiddleware";

export default class LoginController implements IController {
  route: Router;
  authorizationMiddleware: AuthrizaMiddleware;

  constructor(
    private authService: AuthenticationService, 
    private userService: UserService) {
    this.route = Router();
    this.authorizationMiddleware = new AuthrizaMiddleware(this.userService);
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

      return res.render("login", { service });
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

  createRoutes() {
    this.route = this.route.get(
      '/', 
      this.authorizationMiddleware.loadToken.bind(this.authorizationMiddleware), 
      this.getLoginView.bind(this));
    return this.route;
  }
}
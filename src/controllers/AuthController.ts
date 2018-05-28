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
        .json(new ServiceResponse(null, 'Not authorized to service'));
    }
  }

  createRoutes() {
    this.route.get(
      '/check',
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.check.bind(this)
    );
    return this.route;
  }
}

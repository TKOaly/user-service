import * as express from "express";
import ServiceResponse from "../utils/ServiceResponse";
import UserService from "../services/UserService";
import { IController } from "./IController";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import Service from "../models/Service";
import { AuthenticationService } from "../services/AuthenticationService";
import User from "../models/User";

/**
 * Authentication controller.
 *
 * @export
 * @class AuthController
 * @implements {IController}
 */
export default class AuthController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthorizeMiddleware;

  /**
   * Creates an instance of AuthController.
   * @param {UserService} userService
   * @memberof AuthController
   */
  constructor(
    private userService: UserService,
    private authService: AuthenticationService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
  }

  /**
   * Used to check authorization to a specified service
   * @param req
   * @param res
   */
  async check(req: express.Request | any, res: express.Response) {
    if (!req.get("service")) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "No service defined"));
    }

    if (
      req.authorization.token.authenticatedTo.indexOf(req.get("service")) > -1
    ) {
      return res.status(200).json(new ServiceResponse(null, "Success"));
    } else {
      return res
        .status(403)
        .json(new ServiceResponse(null, "Not authorized to service"));
    }
  }

  async authenticateUser(req: express.Request | any, res: express.Response) {
    if (
      !req.body.serviceIdentifier ||
      !req.body.username ||
      !req.body.password
    ) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "Invalid request params"));
    }

    try {
      const service: Service = await this.authService.getServiceWithIdentifier(
        req.body.serviceIdentifier
      );
      if (!service) {
        return res
          .status(400)
          .json(new ServiceResponse(null, "Service not found"));
      }
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    try {
      const user: User = await this.userService.getUserWithUsernameAndPassword(
        req.body.username,
        req.body.password
      );

      let token: string;

      try {
        if (req.authorization) {
          token = this.authService.appendNewServiceAuthenticationToToken(
            req.authorization.token,
            req.body.serviceIdentifier
          );
        } else {
          token = this.authService.createToken(user.id, [
            req.body.serviceIdentifier
          ]);
        }

        return res
          .status(200)
          .json(new ServiceResponse({ token }, "Authenticated", true));
      } catch (e) {
        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }
  }

  /**
   * Creates routes for authentication controller.
   *
   * @returns
   * @memberof AuthController
   */
  createRoutes() {
    this.route.get(
      "/check",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.check.bind(this)
    );
    this.route.post(
      "/authenticate",
      this.authorizeMiddleware.loadToken.bind(this.authorizeMiddleware),
      this.authenticateUser.bind(this)
    );
    return this.route;
  }
}

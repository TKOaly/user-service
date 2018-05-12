import * as express from "express";
import UserService from "../services/UserService";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from "../utils/ServiceResponse";
import User from "../models/User";
import { IController } from "./IController";
import AuthrizaMiddleware from "../utils/AuthorizeMiddleware";
import UserValidator from "../validators/UserValidator";

/**
 * @param {UserService} userService
 */
export default class UserController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthrizaMiddleware;
  userValidator: UserValidator;

  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthrizaMiddleware(this.userService);
    this.userValidator = new UserValidator(this.userService);
  }

  async getMe(req: any, res: express.Response) {
    if (!req.header("service")) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "No service defined"));
    }

    if (
      req.authorization.token.authenticatedTo.indexOf(req.header("service")) < 0
    ) {
      return res
        .status(403)
        .json(new ServiceResponse(null, "User not authorized to service"));
    }

    try {
      let serviceDataPermissions = (await this.authenticationService.getServiceWithIdentifier(
        req.header("service")
      )).dataPermissions;
      let user = await this.userService.fetchUser(req.authorization.user.id);
      res
        .status(200)
        .json(
          new ServiceResponse(
            user.removeNonRequestedData(serviceDataPermissions)
          )
        );
    } catch (e) {
      res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }
  }

  async getAllUsers(req: any, res: express.Response) {
    if (req.authorization.user.role != "yllapitaja") {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    // Request is a search
    if (req.query.searchTerm) {
      try {
        let users = await this.userService.searchUsers(req.query.searchTerm);
        return res
          .status(200)
          .json(
            new ServiceResponse(users.map(u => u.removeSensitiveInformation()))
          );
      } catch (e) {
        res.status(500).json(new ServiceResponse(null, e.message));
      }
      return;
    }

    try {
      let users = await this.userService.fetchAllUsers();
      return res
        .status(200)
        .json(
          new ServiceResponse(users.map(u => u.removeSensitiveInformation()))
        );
    } catch (e) {
      res.status(500).json(new ServiceResponse(null, e.message));
    }
  }

  async modifyMe(req: express.Request, res: express.Response) {}

  async createUser(req: express.Request, res: express.Response) {
    try {
      await this.userValidator.validateCreate(req.body);
      await this.userService.createUser(req.body, req.body.password1);
      return res.status(200).json(req.body);
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  createRoutes() {
    this.route.get(
      "/me",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getMe.bind(this)
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllUsers.bind(this)
    );
    this.route.patch(
      "/me",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.modifyMe.bind(this)
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

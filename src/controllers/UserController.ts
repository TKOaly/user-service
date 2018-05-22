import * as express from "express";
import UserService from "../services/UserService";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from "../utils/ServiceResponse";
import User from "../models/User";
import { IController } from "./IController";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import UserValidator from "../validators/UserValidator";

/**
 * @param {UserService} userService
 */
export default class UserController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthorizeMiddleware;
  userValidator: UserValidator;

  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
    this.userValidator = new UserValidator(this.userService);
  }

  async getUser(req: any, res: express.Response) {
    if (req.params.id === 'me') {
      req.params.id = req.authorization.user.id;
    } else {
      if (req.authorization.user.role === 'kayttaja') {
        return res
          .status(403)
          .json(new ServiceResponse(null, "Forbidden"));
      }
    }
    if (req.params.id === 'me') {
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
    }

    try {
      let serviceDataPermissions = null;
      if (req.params.id === 'me') {
        serviceDataPermissions = (await this.authenticationService.getServiceWithIdentifier(
          req.header("service")
        )).dataPermissions;
      }
      let user = await this.userService.fetchUser(req.params.id);
      res
        .status(200)
        .json(
          new ServiceResponse(
            serviceDataPermissions ? user.removeNonRequestedData(serviceDataPermissions) : user
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

  async modifyMe(req: any, res: express.Response) {
    if (req.params.id === 'me') {
      // Edit me
      try {
        await this.userValidator.validateUpdate(req.authorization.user.id, req.body, req.authorization.user);
        await this.userService.updateUser(req.authorization.user.id, req.body, req.body.password1 || null);
        return res.status(200).json(req.body);
      } catch (err) {
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    } else {
      try {
        await this.userValidator.validateUpdate(req.params.id, req.body, req.authorization.user);
        await this.userService.updateUser(req.params.id, req.body, req.body.password1 || null);
        return res.status(200).json(req.body);
      } catch (err) {
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    }
  }

  async createUser(req: express.Request, res: express.Response) {
    try {
      await this.userValidator.validateCreate(req.body);
      const userIds = await this.userService.createUser(req.body, req.body.password1);
      const user = await this.userService.fetchUser(userIds[0]);
      return res.status(200).json(new ServiceResponse(user.removeSensitiveInformation(), 'Success'));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  createRoutes() {
    this.route.get(
      "/:id",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getUser.bind(this)
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllUsers.bind(this)
    );
    this.route.patch(
      "/:id",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.modifyMe.bind(this)
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

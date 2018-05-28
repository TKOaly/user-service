import * as express from "express";
import UserService from "../services/UserService";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from "../utils/ServiceResponse";
import User, { compareRoles } from "../models/User";
import { IController } from "./IController";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import UserValidator from "../validators/UserValidator";

/**
 * User controller.
 *
 * @export
 * @class UserController
 * @implements {IController}
 */
export default class UserController implements IController {
  route: express.Router;
  authorizeMiddleware: AuthorizeMiddleware;
  userValidator: UserValidator;

  /**
   * Creates an instance of UserController.
   * @param {UserService} userService
   * @param {AuthenticationService} authenticationService
   * @memberof UserController
   */
  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService
  ) {
    this.route = express.Router();
    this.authorizeMiddleware = new AuthorizeMiddleware(this.userService);
    this.userValidator = new UserValidator(this.userService);
  }

  /**
   * Returns a single user.
   *
   * @param {(express.Request | any)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  async getUser(req: express.Request | any, res: express.Response) {
    if (req.params.id === "me") {
      req.params.id = req.authorization.user.id;
    } else {
      if (compareRoles(req.authorization.user.role, "kayttaja") <= 0) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }
    }
    if (req.params.id === "me") {
      if (!req.header("service")) {
        return res
          .status(400)
          .json(new ServiceResponse(null, "No service defined"));
      }

      if (
        req.authorization.token.authenticatedTo.indexOf(req.header("service")) <
        0
      ) {
        return res
          .status(403)
          .json(new ServiceResponse(null, "User not authorized to service"));
      }
    }

    try {
      let serviceDataPermissions: number = null;
      if (req.params.id === "me") {
        serviceDataPermissions = (await this.authenticationService.getServiceWithIdentifier(
          req.header("service")
        )).dataPermissions;
      }
      let user: User = await this.userService.fetchUser(req.params.id);
      return res
        .status(200)
        .json(
          new ServiceResponse(
            serviceDataPermissions
              ? user.removeNonRequestedData(serviceDataPermissions)
              : user.removeSensitiveInformation()
          )
        );
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }
  }

  /**
   * Returns all users.
   *
   * @param {(express.Request | any)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  async getAllUsers(req: express.Request | any, res: express.Response) {
    if (compareRoles(req.authorization.user.role, "kayttaja") <= 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    // Request is a search
    if (req.query.searchTerm) {
      try {
        let users: User[] = await this.userService.searchUsers(
          req.query.searchTerm
        );
        return res
          .status(200)
          .json(
            new ServiceResponse(users.map(u => u.removeSensitiveInformation()))
          );
      } catch (e) {
        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    }

    try {
      let users: User[] = await this.userService.fetchAllUsers();
      return res
        .status(200)
        .json(
          new ServiceResponse(users.map(u => u.removeSensitiveInformation()))
        );
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }
  }

  /**
   * Returns all unpaid users.
   *
   * @param {*} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  async getAllUnpaidUsers(req: any, res: express.Response) {
    if (req.authorization.user.role != "yllapitaja") {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      let users: User[] = await this.userService.fetchAllUnpaidUsers();
      return res
        .status(200)
        .json(
          new ServiceResponse(users.map(u => u.removeSensitiveInformation()))
        );
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }
  }

  /**
   * Modifies a user (me).
   *
   * @param {(express.Request | any)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  async modifyMe(req: express.Request | any, res: express.Response) {
    if (req.params.id === "me") {
      // Edit me
      try {
        await this.userValidator.validateUpdate(
          req.authorization.user.id,
          req.body,
          req.authorization.user
        );
        await this.userService.updateUser(
          req.authorization.user.id,
          req.body,
          req.body.password1 || null
        );
        return res.status(200).json(new ServiceResponse(req.body, "Success"));
      } catch (err) {
        return res
          .status(err.httpErrorCode || 500)
          .json(new ServiceResponse(null, err.message));
      }
    } else {
      try {
        await this.userValidator.validateUpdate(
          Number(req.params.id),
          req.body,
          req.authorization.user
        );
        await this.userService.updateUser(
          Number(req.params.id),
          req.body,
          req.body.password1 || null
        );
        return res.status(200).json(new ServiceResponse(req.body, "Success"));
      } catch (err) {
        return res
          .status(err.httpErrorCode || 500)
          .json(new ServiceResponse(null, err.message));
      }
    }
  }

  /**
   * Creates a user.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  async createUser(req: express.Request, res: express.Response) {
    try {
      await this.userValidator.validateCreate(req.body);
      const userIds: number[] = await this.userService.createUser(
        req.body,
        req.body.password1
      );
      const user: User = await this.userService.fetchUser(userIds[0]);
      return res
        .status(200)
        .json(
          new ServiceResponse(user.removeSensitiveInformation(), "Success")
        );
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Creates routes for UserController.
   *
   * @returns
   * @memberof UserController
   */
  createRoutes() {
    this.route.get(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getUser.bind(this)
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllUsers.bind(this)
    );
    this.route.get(
      "/unpaid",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllUnpaidUsers.bind(this)
    );
    this.route.patch(
      "/:id(\\d+)/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.modifyMe.bind(this)
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

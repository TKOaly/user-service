import * as express from "express";
import Payment from "../models/Payment";
import User, { compareRoles } from "../models/User";
import { AuthenticationService } from "../services/AuthenticationService";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import UserValidator from "../validators/UserValidator";
import { IController } from "./IController";

/**
 * User controller.
 *
 * @export
 * @class UserController
 * @implements {IController}
 */
export default class UserController implements IController {
  public route: express.Router;
  public authorizeMiddleware: AuthorizeMiddleware;
  public userValidator: UserValidator;

  /**
   * Creates an instance of UserController.
   * @param {UserService} userService
   * @param {AuthenticationService} authenticationService
   * @memberof UserController
   */
  constructor(
    private userService: UserService,
    private authenticationService: AuthenticationService,
    private paymentService: PaymentService
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
  public async getUser(req: express.Request | any, res: express.Response): Promise<express.Response> {
    if (req.params.id !== "me") {
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
        req.params.id = req.authorization.user.id;
      }
      const user: User = await this.userService.fetchUser(req.params.id);
      return res
        .status(200)
        .json(
          new ServiceResponse(
            serviceDataPermissions
              ? user.removeNonRequestedData(serviceDataPermissions)
              : user.removeSensitiveInformation(),
            "Success"
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
  public async getAllUsers(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, "kayttaja") <= 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    // Request is a search
    if (req.query.searchTerm) {
      try {
        const users: User[] = await this.userService.searchUsers(
          req.query.searchTerm
        );
        return res
          .status(200)
          .json(
            new ServiceResponse(
              users.map((u: User) => u.removeSensitiveInformation())
            )
          );
      } catch (e) {
        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    }

    // Request is only looking for certain fields
    if (req.query.fields) {
      try {
        const users: User[] = await this.userService.fetchAllWithSelectedFields(
          req.query.fields,
          req.query.conditions || null
        );
        return res
          .status(200)
          .json(
            new ServiceResponse(
              users.map((u: User) => u.removeSensitiveInformation())
            )
          );
      } catch (e) {
        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    }

    try {
      const users: User[] = await this.userService.fetchAllUsers();
      return res
        .status(200)
        .json(
          new ServiceResponse(
            users.map((u: User) => u.removeSensitiveInformation())
          )
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
  public async getAllUnpaidUsers(req: any, res: express.Response): Promise<express.Response> {
    if (req.authorization.user.role !== "yllapitaja") {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      const users: User[] = await this.userService.fetchAllUnpaidUsers();
      return res
        .status(200)
        .json(
          new ServiceResponse(
            users.map((u: User) => u.removeSensitiveInformation())
          )
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
  public async modifyMe(req: express.Request | any, res: express.Response): Promise<express.Response> {
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
  public async createUser(req: express.Request, res: express.Response): Promise<express.Response> {
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
   * Finds payments for user
   *
   */
  public async findUserPayment(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    try {
      let id: number;
      if (
        req.params.id === "me" ||
        req.authorization.user.id === Number(req.params.id)
      ) {
        id = req.authorization.user.id;
      } else {
        if (compareRoles(req.authorization.user.role, "jasenvirkailija") < 0) {
          return res.status(403).json(new ServiceResponse(null, "Forbidden"));
        } else {
          id = Number(req.params.id);
        }
      }

      let payment: Payment = null;
      if (req.query.query) {
        if (req.query.query === "validPayment") {
          payment = await this.paymentService.fetchValidPaymentForUser(id);
        } else {
          return res.status(400).json(new ServiceResponse(null, "Bad query"));
        }
      } else {
        payment = await this.paymentService.fetchPaymentByPayer(id);
      }

      return res.status(200).json(new ServiceResponse(payment, "Success"));
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
  public createRoutes(): express.Router {
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
    this.route.get(
      "/payments/unpaid",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.getAllUnpaidUsers.bind(this)
    );
    this.route.patch(
      "/:id/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.modifyMe.bind(this)
    );
    this.route.get(
      "/:id/payments/",
      this.authorizeMiddleware.authorize.bind(this.authorizeMiddleware),
      this.findUserPayment.bind(this)
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

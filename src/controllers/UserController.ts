import * as express from "express";
import UserRoleString from "../enum/UserRoleString";
import IController from "../interfaces/IController";
import Payment from "../models/Payment";
import Service from "../models/Service";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import UserValidator from "../validators/UserValidator";

/**
 * User controller.
 *
 * @export
 * @class UserController
 * @implements {IController}
 */
export default class UserController implements IController {
  /**
   * Router
   *
   * @type {express.Router}
   * @memberof UserController
   */
  public route: express.Router;
  /**
   * Authorize middleware
   *
   * @type {AuthorizeMiddleware}
   * @memberof UserController
   */
  public authorizeMiddleware: AuthorizeMiddleware;
  /**
   * User validator
   *
   * @type {UserValidator}
   * @memberof UserController
   */
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
   * Returns the currently logged in user's data.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async getMe(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
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
      const service: Service = await this.authenticationService.getServiceWithIdentifier(
        req.header("service")
      );
      const serviceDataPermissions: number = service.dataPermissions;
      const user: User = await this.userService.fetchUser(
        req.authorization.user.id
      );
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
   * Returns a single user.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async getUser(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    if (req.params.id !== "me") {
      if (
        compareRoles(req.authorization.user.role, UserRoleString.Kayttaja) <= 0
      ) {
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
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async getAllUsers(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    if (
      compareRoles(req.authorization.user.role, UserRoleString.Kayttaja) <= 0
    ) {
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
   * @param {express.Request & IASRequest} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async getAllUnpaidUsers(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    if (req.authorization.user.role !== UserRoleString.Yllapitaja) {
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
   * Modifies a user.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async modifyUser(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    try {
      await this.userValidator.validateUpdate(
        req.params.id,
        req.body,
        req.authorization.user
      );
      const update: number = await this.userService.updateUser(
        req.params.id,
        req.body,
        req.body.password1 || null
      );
      if (update === 1) {
        return res.status(200).json(new ServiceResponse(req.body, "Success"));
      } else {
        return res
          .status(200)
          .json(new ServiceResponse(req.body, "User was not modified"));
      }
    } catch (err) {
      return res
        .status(err.httpErrorCode || 500)
        .json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Modifies a user (me).
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async modifyMe(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
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
  }

  /**
   * Creates a user.
   *
   * @param {express.Request} req
   * @param {express.Response} res
   * @returns
   * @memberof UserController
   */
  public async createUser(
    req: express.Request,
    res: express.Response
  ): Promise<express.Response> {
    try {
      await this.userValidator.validateCreate(req.body);
      const userId: number = await this.userService.createUser(
        req.body,
        req.body.password1
      );
      const user: User = await this.userService.fetchUser(userId);
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
        compareRoles(
          req.authorization.user.role,
          UserRoleString.Jasenvirkailija
        ) < 0
      ) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      } else {
        id = Number(req.params.id);
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
   * Finds payments for current user
   *
   */
  public async findMePayment(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
    try {
      const id: number = req.authorization.user.id;

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
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getUser.bind(this)
    );
    this.route.get(
      "/me",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getMe.bind(this)
    );
    this.route.get(
      "/",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getAllUsers.bind(this)
    );
    this.route.get(
      "/payments/unpaid",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.getAllUnpaidUsers.bind(this)
    );
    this.route.patch(
      "/:id(\\d+)",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.modifyUser.bind(this)
    );
    this.route.patch(
      "/me",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.modifyMe.bind(this)
    );
    this.route.get(
      "/:id(\\d+)/payments",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.findUserPayment.bind(this)
    );
    this.route.get(
      "/me/payments",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.findMePayment.bind(this)
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

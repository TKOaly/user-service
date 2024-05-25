import * as express from "express";
import * as Sentry from "@sentry/node";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import Payment from "../models/Payment";
import AuthenticationService from "../services/AuthenticationService";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import UserValidator, { isValidUser } from "../validators/UserValidator";

class UserController implements Controller {
  public route: express.Router;
  public userValidator: UserValidator;

  constructor() {
    this.route = express.Router();
    this.userValidator = new UserValidator();
  }

  /**
   * Returns the currently logged in user's data.
   */
  public async getMe(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    const serviceHeader = req.header("service");
    if (!serviceHeader) {
      return res.status(400).json(new ServiceResponse(null, "No service defined"));
    }

    if (req.authorization.token.authenticatedTo.indexOf(serviceHeader) < 0) {
      return res.status(403).json(new ServiceResponse(null, "User not authorized to service"));
    }

    try {
      const service = await AuthenticationService.getServiceWithIdentifier(serviceHeader);
      const serviceDataPermissions = service.dataPermissions;
      const user = await UserService.fetchUser(req.authorization.user.id);
      return res
        .status(200)
        .json(
          new ServiceResponse(
            serviceDataPermissions
              ? user.removeNonRequestedData(serviceDataPermissions)
              : user.removeSensitiveInformation(),
            "Success",
          ),
        );
    } catch (e) {
      return res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }
  }

  public async getUser(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (req.params.id !== "me") {
      if (compareRoles(req.authorization.user.role, UserRoleString.Kayttaja) <= 0) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }
    }
    if (req.params.id === "me") {
      const serviceHeader = req.header("service");
      if (!serviceHeader) {
        return res.status(400).json(new ServiceResponse(null, "No service defined"));
      }

      if (req.authorization.token.authenticatedTo.indexOf(serviceHeader) < 0) {
        return res.status(403).json(new ServiceResponse(null, "User not authorized to service"));
      }
    }

    try {
      let serviceDataPermissions: number | null = null;
      if (req.params.id === "me") {
        const serviceHeader = req.header("service");
        if (!serviceHeader) {
          return res.status(400).json(new ServiceResponse(null, "No service defined"));
        }
        serviceDataPermissions = (await AuthenticationService.getServiceWithIdentifier(serviceHeader)).dataPermissions;
        req.params.id = String(req.authorization.user.id);
      }
      const user = await UserService.fetchUser(Number(req.params.id));
      return res
        .status(200)
        .json(
          new ServiceResponse(
            serviceDataPermissions
              ? user.removeNonRequestedData(serviceDataPermissions)
              : user.removeSensitiveInformation(),
            "Success",
          ),
        );
    } catch (e) {
      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  }

  /**
   * Returns all users.
   */
  public async getAllUsers(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (compareRoles(req.authorization.user.role, UserRoleString.Kayttaja) <= 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    // Request is a search
    if (req.query.searchTerm) {
      try {
        const users = await UserService.searchUsers(req.query.searchTerm as string);
        return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
      } catch (e) {
        return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    // Request is only looking for certain fields
    if (req.query.fields) {
      try {
        const users = await UserService.fetchAllWithSelectedFields(
          req.query.fields as string[],
          req.query.conditions ? req.query.conditions.toString().split(",") : undefined,
        );

        return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
      } catch (e) {
        return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    if (req.query.conditions) {
      try {
        const users = await UserService.fetchAllWithSelectedFields(
          undefined,
          req.query.conditions.toString().split(","),
        );

        return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
      } catch (e) {
        return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    try {
      const users = await UserService.fetchAllUsers();
      return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
    } catch (e) {
      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  }

  public async getAllUnpaidUsers(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    if (req.authorization.user.role !== UserRoleString.Yllapitaja) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      const users = await UserService.fetchAllUnpaidUsers();
      return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }
  }

  public async modifyUser(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      const transformedBody = await this.userValidator.validateUpdate(
        Number(req.params.id),
        req.body,
        req.authorization.user,
      );
      const update = await UserService.updateUser(Number(req.params.id), transformedBody, req.body.password1 || null);
      if (update === 1) {
        return res.status(200).json(new ServiceResponse(req.body, "Success"));
      } else {
        return res.status(200).json(new ServiceResponse(req.body, "User was not modified"));
      }
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error modifying user",
        data: {
          userId: req.params.id,
          modifierUserId: req.authorization.user.id,
        },
      });

      Sentry.captureException(err);
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  /**
   * Modifies a user (me).
   */
  public async modifyMe(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    // Edit me
    try {
      await this.userValidator.validateUpdate(req.authorization.user.id, req.body, req.authorization.user);
      await UserService.updateUser(req.authorization.user.id, req.body, req.body.password1 || null);
      return res.status(200).json(new ServiceResponse(req.body, "Success"));
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error modifying user (self)",
        data: {
          userId: req.params.id,
        },
      });
      Sentry.captureException(err);
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async createUser(req: express.Request, res: express.Response): Promise<express.Response> {
    try {
      // Make sure request body is the correct type
      const validatedBody = req.body;
      if (!isValidUser(validatedBody)) {
        return res.status(400).json(new ServiceResponse(null, "Missing required information"));
      }
      // Returns a validated user and password
      const { user, password } = await this.userValidator.validateCreate(validatedBody);
      const userId = await UserService.createUser(user, password);
      const createdUser = await UserService.fetchUser(userId);
      if (createdUser === undefined) {
        return res.status(400).json(new ServiceResponse(null, "Error creating user"));
      }
      return res.status(200).json(new ServiceResponse({
        ...user.removeSensitiveInformation(),
        accessToken: AuthenticationService.createToken(userId, [req.headers['service']?.toString() ?? '']),
      }, "Success"));
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error creating user",
      });
      Sentry.captureException(err);
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async findUserPayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      let id: number;
      if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      } else {
        id = Number(req.params.id);
      }

      let payment: Payment | null = null;
      if (req.query.query) {
        if (req.query.query === "validPayment") {
          payment = await PaymentService.fetchValidPaymentForUser(id);
        } else {
          return res.status(400).json(new ServiceResponse(null, "Bad query"));
        }
      } else {
        payment = await PaymentService.fetchPaymentByPayer(id);
      }

      return res.status(200).json(new ServiceResponse(payment, "Success"));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async findMePayment(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      const id: number = req.authorization.user.id;

      let payment: Payment | null = null;
      if (req.query.query) {
        if (req.query.query === "validPayment") {
          payment = await PaymentService.fetchValidPaymentForUser(id);
        } else {
          return res.status(400).json(new ServiceResponse(null, "Bad query"));
        }
      } else {
        payment = await PaymentService.fetchPaymentByPayer(id);
      }

      return res.status(200).json(new ServiceResponse(payment, "Success"));
    } catch (err) {
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async setUserMembership(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }
      const id = parseInt(req.params.id, 10);
      const membership = String(req.body.membership);
      if (!membership) {
        return res.status(400).json(new ServiceResponse(null, "Membership not set in request"));
      }

      if (membership === "hyvaksy") {
        const payment = await PaymentService.fetchValidPaymentForUser(id);
        if (!payment) {
            return res.status(400).json(new ServiceResponse(null, "User has not applied for membership"));
        }
        UserService.updateUser(id, { membership: payment.membership_applied_for });
      } else if (membership === "ei-jasen" || membership === "erotettu") {
        UserService.updateUser(id, {
          membership,
          role: "kayttaja",
        });
      }
      return res.status(200).json(new ServiceResponse(null, "User updated", true));
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error setting user membership",
        data: {
          userId: req.params.id,
          membership: req.body.membership,
          modifierUserId: req.authorization.user.id,
        },
      });
      Sentry.captureException(err);
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public async deleteUser(req: express.Request & IASRequest, res: express.Response): Promise<express.Response> {
    try {
      if (compareRoles(req.authorization.user.role, UserRoleString.Yllapitaja) === 0) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }
      const id = parseInt(req.params.id, 10);
      const result = await UserService.deleteUser(id);
      if (result) {
        return res.status(200).json(new ServiceResponse(null, "User deleted", true));
      } else {
        return res.status(500).json(new ServiceResponse(null, "Failed to delete user", false));
      }
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error deleting user",
        data: {
          userId: req.params.id,
          deleterUserId: req.authorization.user.id,
        },
      });
      Sentry.captureException(err);
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  }

  public createRoutes(): express.Router {
    // @ts-expect-error
    this.route.get("/:id", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.getUser.bind(this)); // @ts-expect-error
    this.route.get("/me", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.getMe.bind(this)); // @ts-expect-error
    this.route.get("/", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.getAllUsers.bind(this));
    this.route.get(
      "/payments/unpaid", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.getAllUnpaidUsers.bind(this),
    );
    this.route.patch(
      "/:id(\\d+)", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.modifyUser.bind(this),
    ); // @ts-expect-error
    this.route.patch("/me", AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware), this.modifyMe.bind(this));
    this.route.get(
      "/:id(\\d+)/payments", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.findUserPayment.bind(this),
    );
    this.route.get(
      "/me/payments", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.findMePayment.bind(this),
    );
    this.route.put(
      "/:id(\\d+)/membership", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.setUserMembership.bind(this),
    );
    this.route.delete(
      "/:id(\\d+)", // @ts-expect-error
      AuthorizeMiddleware.authorize(true).bind(AuthorizeMiddleware),
      this.deleteUser.bind(this),
    );
    this.route.post("/", this.createUser.bind(this));
    return this.route;
  }
}

export default new UserController();

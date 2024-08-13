import * as express from "express";
import * as Sentry from "@sentry/node";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import Payment from "../models/Payment";
import { removeNonRequestedData, removeSensitiveInformation } from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { AuthorizedRequestHandler } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import UserValidator, { isValidUser } from "../validators/UserValidator";
import ServiceError from "../utils/ServiceError";

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
  getMe: AuthorizedRequestHandler = async (req, res) => {
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
              ? removeNonRequestedData(user, serviceDataPermissions)
              : removeSensitiveInformation(user),
            "Success",
          ),
        );
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }
  };

  getUser: AuthorizedRequestHandler = async (req, res) => {
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
              ? removeNonRequestedData(user, serviceDataPermissions)
              : removeSensitiveInformation(user),
            "Success",
          ),
        );
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  };

  /**
   * Returns all users.
   */
  getAllUsers: AuthorizedRequestHandler = async (req, res) => {
    if (compareRoles(req.authorization.user.role, UserRoleString.Kayttaja) <= 0) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    // Request is a search
    if (req.query.searchTerm) {
      try {
        const users = await UserService.searchUsers(req.query.searchTerm as string);
        return res.status(200).json(new ServiceResponse(users.map(u => removeSensitiveInformation(u))));
      } catch (e) {
        if (!(e instanceof ServiceError)) {
          throw e;
        }

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

        return res.status(200).json(new ServiceResponse(users.map(u => removeSensitiveInformation(u))));
      } catch (e) {
        if (!(e instanceof ServiceError)) {
          throw e;
        }

        return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    if (req.query.conditions) {
      try {
        const users = await UserService.fetchAllWithSelectedFields(
          undefined,
          req.query.conditions.toString().split(","),
        );

        return res.status(200).json(new ServiceResponse(users.map(u => removeSensitiveInformation(u))));
      } catch (e) {
        if (!(e instanceof ServiceError)) {
          throw e;
        }

        return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    try {
      const users = await UserService.fetchAllUsers();
      return res.status(200).json(new ServiceResponse(users.map(u => removeSensitiveInformation(u))));
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode || 500).json(new ServiceResponse(null, e.message));
    }
  };

  getAllUnpaidUsers: AuthorizedRequestHandler = async (req, res) => {
    if (req.authorization.user.role !== UserRoleString.Yllapitaja) {
      return res.status(403).json(new ServiceResponse(null, "Forbidden"));
    }

    try {
      const users = await UserService.fetchAllUnpaidUsers();
      return res.status(200).json(new ServiceResponse(users.map(u => removeSensitiveInformation(u))));
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(500).json(new ServiceResponse(null, e.message));
    }
  };

  modifyUser: AuthorizedRequestHandler = async (req, res) => {
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

      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  /**
   * Modifies a user (me).
   */
  modifyMe: AuthorizedRequestHandler = async (req, res) => {
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

      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  createUser: express.RequestHandler = async (req, res) => {
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
      return res.status(200).json(
        new ServiceResponse(
          {
            ...removeSensitiveInformation(user),
            accessToken: AuthenticationService.createToken(userId, [req.headers.service?.toString() ?? ""]),
          },
          "Success",
        ),
      );
    } catch (err) {
      Sentry.addBreadcrumb({
        message: "Error creating user",
      });
      Sentry.captureException(err);

      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  findUserPayment: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  findMePayment: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }

      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  setUserMembership: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  deleteUser: AuthorizedRequestHandler = async (req, res) => {
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
      if (!(err instanceof ServiceError)) {
        throw err;
      }
      return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
    }
  };

  public createRoutes(): express.Router {
    const authorized = express.Router();

    authorized.use(AuthorizeMiddleware.authorize(true));

    authorized.get("/:id", this.getUser as express.RequestHandler);
    authorized.get("/me", this.getMe as express.RequestHandler);
    authorized.get("/", this.getAllUsers as express.RequestHandler);
    authorized.get("/payments/unpaid", this.getAllUnpaidUsers as express.RequestHandler);
    authorized.patch("/:id(\\d+)", this.modifyUser as express.RequestHandler);
    authorized.patch("/me", this.modifyMe as express.RequestHandler);
    authorized.get("/:id(\\d+)/payments", this.findUserPayment as express.RequestHandler);
    authorized.get("/me/payments", this.findMePayment as express.RequestHandler);
    authorized.put("/:id(\\d+)/membership", this.setUserMembership as express.RequestHandler);
    authorized.delete("/:id(\\d+)", this.deleteUser as express.RequestHandler);

    this.route.post("/", this.createUser);

    this.route.use(authorized);

    return this.route;
  }
}

export default new UserController();

import * as express from "express";
import * as Raven from "raven";
import UserRoleString from "../enum/UserRoleString";
import { Env } from "../env";
import Controller from "../interfaces/Controller";
import Payment from "../models/Payment";
import AuthenticationService from "../services/AuthenticationService";
import PaymentService from "../services/PaymentService";
import UserService from "../services/UserService";
import { AuthorizeMiddleware } from "../middleware/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";
import UserValidator, { isValidUser } from "../validators/UserValidator";

export class UserController implements Controller {
  constructor(private readonly env: Env) {}

  public createRoutes(): express.Router {
    const userValidator = new UserValidator();
    const router = express.Router();
    const authMiddleware = AuthorizeMiddleware(this.env).authorize(true);

    router.get("/:id", authMiddleware, async (req, res) => {
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
          serviceDataPermissions = (await AuthenticationService.getServiceWithIdentifier(serviceHeader))
            .dataPermissions;
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
    });

    router.get("/me", authMiddleware, async (req, res) => {
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
    });

    router.get("/", authMiddleware, async (req, res) => {
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
    });

    router.get("/payments/unpaid", authMiddleware, async (req, res) => {
      if (req.authorization.user.role !== UserRoleString.Yllapitaja) {
        return res.status(403).json(new ServiceResponse(null, "Forbidden"));
      }

      try {
        const users = await UserService.fetchAllUnpaidUsers();
        return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())));
      } catch (e) {
        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    });

    router.patch("/:id(\\d+)", authMiddleware, async (req, res) => {
      try {
        const transformedBody = await userValidator.validateUpdate(
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
        Raven.captureBreadcrumb({
          message: "Error modifying user",
          data: {
            userId: req.params.id,
            modifierUserId: req.authorization.user.id,
          },
        });
        Raven.captureException(err);
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    });

    router.patch("/me", authMiddleware, async (req, res) => {
      // Edit me
      try {
        await userValidator.validateUpdate(req.authorization.user.id, req.body, req.authorization.user);
        await UserService.updateUser(req.authorization.user.id, req.body, req.body.password1 || null);
        return res.status(200).json(new ServiceResponse(req.body, "Success"));
      } catch (err) {
        Raven.captureBreadcrumb({
          message: "Error modifying user (self)",
          data: {
            userId: req.params.id,
          },
        });
        Raven.captureException(err);
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    });

    router.get("/:id(\\d+)/payments", authMiddleware, async (req, res) => {
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
    });

    router.get("/me/payments", authMiddleware, async (req, res) => {
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
    });

    router.put("/:id(\\d+)/membership", authMiddleware, async (req, res) => {
      try {
        if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
          return res.status(403).json(new ServiceResponse(null, "Forbidden"));
        }
        const id = parseInt(req.params.id, 10);
        const user = await UserService.fetchUser(id);
        const membership = String(req.body.membership);
        if (!membership) {
          return res.status(400).json(new ServiceResponse(null, "Membership not set in request"));
        }

        if (membership === "hyvaksy") {
          UserService.updateUser(id, { membership: user.isTKTL ? "jasen" : "ulkojasen" });
        } else if (membership === "ei-jasen" || membership === "erotettu") {
          UserService.updateUser(id, {
            membership,
            role: "kayttaja",
          });
        }
        return res.status(200).json(new ServiceResponse(null, "User updated", true));
      } catch (err) {
        Raven.captureBreadcrumb({
          message: "Error setting user membership",
          data: {
            userId: req.params.id,
            membership: req.body.membership,
            modifierUserId: req.authorization.user.id,
          },
        });
        Raven.captureException(err);
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    });

    router.delete("/:id(\\d+)", authMiddleware, async (req, res) => {
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
        Raven.captureBreadcrumb({
          message: "Error deleting user",
          data: {
            userId: req.params.id,
            deleterUserId: req.authorization.user.id,
          },
        });
        Raven.captureException(err);
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    });

    router.post("/", async (req, res) => {
      try {
        // Make sure request body is the correct type
        const validatedBody = req.body;
        if (!isValidUser(validatedBody)) {
          return res.status(400).json(new ServiceResponse(null, "Missing required information"));
        }
        // Returns a validated user and password
        const { user, password } = await userValidator.validateCreate(validatedBody);
        const userId = await UserService.createUser(user, password);
        const createdUser = await UserService.fetchUser(userId);
        if (createdUser === undefined) {
          return res.status(400).json(new ServiceResponse(null, "Error creating user"));
        }
        return res.status(200).json(new ServiceResponse(user.removeSensitiveInformation(), "Success"));
      } catch (err) {
        Raven.captureBreadcrumb({
          message: "Error creating user",
        });
        Raven.captureBreadcrumb(err);
        return res.status(err.httpErrorCode || 500).json(new ServiceResponse(null, err.message));
      }
    });
    return router;
  }
}

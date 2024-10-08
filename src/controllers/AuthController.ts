import express, { RequestHandler } from "express";
import Controller from "../interfaces/Controller";
import User, { removeSensitiveInformation } from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import UserService from "../services/UserService";
import AuthorizeMiddleware from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";
import ServiceError from "../utils/ServiceError";

class AuthController implements Controller {
  private route: express.Router;

  constructor() {
    this.route = express.Router();
  }

  check: RequestHandler = async (req, res) => {
    const service = req.get("service");

    if (service === undefined) {
      return res.status(400).json(new ServiceResponse(null, "No service defined"));
    }

    if (req.authorization!.token.authenticatedTo.indexOf(service) > -1) {
      return res.status(200).json(new ServiceResponse(null, "Success"));
    } else {
      return res.status(403).json(new ServiceResponse(null, "Not authorized to service"));
    }
  };

  authenticateUser: RequestHandler = async (req, res) => {
    if (!req.body.serviceIdentifier || !req.body.username || !req.body.password) {
      return res.status(400).json(new ServiceResponse(null, "Invalid request params"));
    }

    try {
      await AuthenticationService.getServiceWithIdentifier(req.body.serviceIdentifier);
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }

    try {
      const user: User = await UserService.getUserWithUsernameAndPassword(req.body.username, req.body.password);

      let token: string;

      try {
        if (req.authorization) {
          token = AuthenticationService.appendNewServiceAuthenticationToToken(
            req.authorization.token,
            req.body.serviceIdentifier,
          );
        } else {
          token = AuthenticationService.createToken(user.id, [req.body.serviceIdentifier]);
        }

        return res.status(200).json(new ServiceResponse({ token }, "Authenticated", true));
      } catch (e) {
        if (!(e instanceof ServiceError)) {
          throw e;
        }

        return res.status(500).json(new ServiceResponse(null, e.message));
      }
    } catch (e) {
      if (!(e instanceof ServiceError)) {
        throw e;
      }

      return res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
    }
  };

  /**
   * Renders a view to calculate service permissions.
   */
  public calcPermissions(_req: express.Request, res: express.Response): void {
    const dummyObject: User = new User({
      created: new Date(),
      deleted: 0,
      email: "",
      hashed_password: "",
      password_hash: "",
      hyy_member: 1,
      id: -1,
      membership: "jasen",
      modified: new Date(),
      name: "",
      phone: "",
      residence: "",
      role: "",
      salt: "",
      screen_name: "",
      tktl: 1,
      username: "",
      hy_staff: 0,
      hy_student: 0,
      tktdt_student: 0,
      last_seq: 0,
      registration_ban_bypass_until: null,
    });
    return res.render("calcPermissions", {
      userKeys: Object.keys(dummyObject),
    });
  }

  /**
   * Calculates service permissions.
   */
  public calcPermissionsPost(req: express.Request, res: express.Response): void {
    const wantedPermissions: {
      [key: string]: string;
    } = req.body;
    if (wantedPermissions.submit) {
      delete wantedPermissions.submit;
    }

    const dummyObject = removeSensitiveInformation(
      new User({
        created: new Date(),
        deleted: 0,
        email: "",
        hashed_password: "",
        password_hash: "",
        hyy_member: 1,
        id: -1,
        membership: "jasen",
        modified: new Date(),
        name: "",
        phone: "",
        residence: "",
        role: "",
        salt: "",
        screen_name: "",
        tktl: 1,
        username: "",
        hy_staff: 0,
        hy_student: 0,
        tktdt_student: 0,
        last_seq: 0,
        registration_ban_bypass_until: null,
      }),
    );

    let permissionInteger = 0;

    Object.keys(dummyObject).forEach((value: string, i: number) => {
      Object.keys(wantedPermissions).forEach((bodyValue: string, _a) => {
        if (value === bodyValue) {
          if (permissionInteger === 0) {
            permissionInteger = Math.pow(2, i);
          } else {
            permissionInteger = permissionInteger | Math.pow(2, i);
          }
        }
      });
    });

    return res.render("calcPermissions", {
      userKeys: Object.keys(dummyObject),
      wantedPermissions: Object.keys(wantedPermissions),
      permissionInteger,
    });
  }

  /**
   * Creates routes for authentication controller.
   */
  public createRoutes(): express.Router {
    this.route.get("/check", AuthorizeMiddleware.authorize(true), this.check);
    this.route.post("/authenticate", AuthorizeMiddleware.loadToken.bind(AuthorizeMiddleware), this.authenticateUser);
    if (process.env.NODE_ENV !== "production") {
      this.route.get("/calcPermissions", this.calcPermissions.bind(this));
      this.route.post("/calcPermissions", this.calcPermissionsPost.bind(this));
    }
    return this.route;
  }
}

export default new AuthController();

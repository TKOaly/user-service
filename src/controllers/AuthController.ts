import express from "express";
import IController from "../interfaces/IController";
import User from "../models/User";
import AuthenticationService from "../services/AuthenticationService";
import UserService from "../services/UserService";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceResponse from "../utils/ServiceResponse";

/**
 * Authentication controller.
 *
 * @export
 * @class AuthController
 * @implements {IController}
 */
export default class AuthController implements IController {
  /**
   * Router
   *
   * @private
   * @type {express.Router}
   * @memberof AuthController
   */
  private route: express.Router;
  /**
   * Authorization middleware
   *
   * @private
   * @type {AuthorizeMiddleware}
   * @memberof AuthController
   */
  private authorizeMiddleware: AuthorizeMiddleware;

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
   * Used to check authorization to a specified service.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns {Promise<express.Response>}
   * @memberof AuthController
   */
  public async check(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
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

  /**
   * Authenticates the user.
   *
   * @param {(express.Request & IASRequest)} req
   * @param {express.Response} res
   * @returns {Promise<express.Response>}
   * @memberof AuthController
   */
  public async authenticateUser(
    req: express.Request & IASRequest,
    res: express.Response
  ): Promise<express.Response> {
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
      await this.authService.getServiceWithIdentifier(
        req.body.serviceIdentifier
      );
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
   * Renders a view to calculate service permissions.
   *
   * @param {(express.Request)} req
   * @param {express.Response} res
   * @returns {void}
   * @memberof AuthController
   */
  public calcPermissions(req: express.Request, res: express.Response): void {
    const dummyObject: User = new User({
      created: new Date(),
      deleted: false,
      email: "",
      hashed_password: "",
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
      username: ""
    });
    return res.render("calcPermissions", {
      userKeys: Object.keys(dummyObject)
    });
  }

  /**
   * Calculates service permissions.
   *
   * @param {(express.Request)} req
   * @param {express.Response} res
   * @returns {void}
   * @memberof AuthController
   */
  public calcPermissionsPost(
    req: express.Request,
    res: express.Response
  ): void {
    const wantedPermissions: {
      [key: string]: string;
    } =
      req.body;
    if (wantedPermissions.submit) {
      delete wantedPermissions.submit;
    }

    const dummyObject: User = new User({
      created: new Date(),
      deleted: false,
      email: "",
      hashed_password: "",
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
      username: ""
    }).removeSensitiveInformation();

    let permissionInteger: number = 0;

    Object.keys(dummyObject.removeSensitiveInformation()).forEach(
      (value: string, i: number) => {
        Object.keys(wantedPermissions).forEach(
          (bodyValue: string, a: number) => {
            if (value === bodyValue) {
              if (permissionInteger === 0) {
                permissionInteger = Math.pow(2, i);
              } else {
                permissionInteger = permissionInteger | Math.pow(2, i);
              }
              return;
            }
          }
        );
      }
    );

    return res.render("calcPermissions", {
      userKeys: Object.keys(dummyObject),
      wantedPermissions: Object.keys(wantedPermissions),
      permissionInteger
    });
  }

  /**
   * Creates routes for authentication controller.
   *
   * @returns
   * @memberof AuthController
   */
  public createRoutes(): express.Router {
    this.route.get(
      "/check",
      this.authorizeMiddleware.authorize(true).bind(this.authorizeMiddleware),
      this.check.bind(this)
    );
    this.route.post(
      "/authenticate",
      this.authorizeMiddleware.loadToken.bind(this.authorizeMiddleware),
      this.authenticateUser.bind(this)
    );
    if (process.env.NODE_ENV !== "production") {
      this.route.get("/calcPermissions", this.calcPermissions.bind(this));
      this.route.post("/calcPermissions", this.calcPermissionsPost.bind(this));
    }
    return this.route;
  }
}

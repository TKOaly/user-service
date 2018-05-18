import * as express from "express";
import ServiceResponse from "./ServiceResponse";
import { stringToServiceToken, ServiceToken } from "../token/Token";
import UserService from "../services/UserService";
import User from "../models/User";

/**
 * IASRequest interface.
 *
 * @interface IASRequest
 * @extends {express.Request}
 */
export interface IASRequest extends express.Request {
  /**
   * Authorization data.
   * @memberof IASRequest
   */
  authorization: {
    /**
     * User
     *
     * @type {User}
     */
    user: User;
    /**
     * Service token
     *
     * @type {ServiceToken}
     */
    token: ServiceToken;
  };
}

/**
 * Authorize middleware.
 *
 * @export
 * @class AuthorizeMiddleware
 */
export default class AuthorizeMiddleware {
  /**
   * Creates an instance of AuthorizeMiddleware.
   * @param {UserService} userService
   * @memberof AuthorizeMiddleware
   */
  constructor(private userService: UserService) {}

  /**
   * Authorizes the user.
   *
   * @param {IASRequest} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns
   * @memberof AuthorizeMiddleware
   */
  async authorize(
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    let token = req.headers["authorization"];
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        let parsedToken = stringToServiceToken(token.slice(7).toString());
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        };
        return next();
      } catch (e) {
        return res
          .status(e.httpStatusCode || 500)
          .json(new ServiceResponse(null, e.message));
      }
    } else if (req.cookies.token) {
      try {
        let parsedToken = stringToServiceToken(req.cookies.token);
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        };
        return next();
      } catch (e) {
        return res
          .status(e.httpStatusCode || 500)
          .json(new ServiceResponse(null, e.message));
      }
    } else {
      return res.status(401).json(new ServiceResponse(null, "Unauthorized"));
    }
  }

  /**
   * Loads the token.
   *
   * @param {IASRequest} req
   * @param {express.Response} res
   * @param {express.NextFunction} next
   * @returns
   * @memberof AuthorizeMiddleware
   */
  async loadToken(
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    let token = req.headers["authorization"];
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        let parsedToken = stringToServiceToken(token.slice(7).toString());
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        };
        return next();
      } catch (e) {
        return res
          .status(e.httpStatusCode || 500)
          .json(new ServiceResponse(null, e.message));
      }
    }

    if (req.cookies.token) {
      try {
        let parsedToken = stringToServiceToken(req.cookies.token);
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        };
        return next();
      } catch (e) {
        return res
          .status(e.httpStatusCode || 500)
          .json(new ServiceResponse(null, e.message));
      }
    }
    return next();
  }
}

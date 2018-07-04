import * as express from "express";
import User from "../models/User";
import UserService from "../services/UserService";
import { ServiceToken, stringToServiceToken } from "../token/Token";
import ServiceResponse from "./ServiceResponse";

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
   * @param {boolean} returnAsJson Return as JSOn 
   *
   * @memberof AuthorizeMiddleware
   */
  public authorize = (returnAsJson: boolean): any => async (
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction
  ): Promise<express.Response | any> => {
    const token: string = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken: ServiceToken = stringToServiceToken(
          token.slice(7).toString()
        );
        const user: User = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user
        };
        return next();
      } catch (e) {
        if (returnAsJson) {
          return res
            .status(e.httpStatusCode || 500)
            .json(new ServiceResponse(null, e.message));
        } else {
          return res.status(e.httpStatusCode || 500).render("serviceError", {
            error: e.message
          });
        }
      }
    } else if (req.cookies.token) {
      try {
        const parsedToken: ServiceToken = stringToServiceToken(
          req.cookies.token
        );
        const user: User = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user
        };
        return next();
      } catch (e) {
        if (returnAsJson) {
          return res
            .status(e.httpStatusCode || 500)
            .json(new ServiceResponse(null, e.message));
        } else {
          return res.status(e.httpStatusCode || 500).render("serviceError", {
            error: e.message
          });
        }
      }
    } else {
      if (returnAsJson) {
        return res.status(401).json(new ServiceResponse(null, "Unauthorized"));
      } else {
        return res.status(401).render("serviceError", {
          error: "Unauthorized"
        });
      }
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
  public async loadToken(
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction
  ): Promise<express.Response | any> {
    const token: string = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken: ServiceToken = stringToServiceToken(
          token.slice(7).toString()
        );
        const user: User = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user
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
        const parsedToken: ServiceToken = stringToServiceToken(
          req.cookies.token
        );
        const user: User = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user
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

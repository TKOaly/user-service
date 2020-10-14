import * as express from "express";
import { ISessionUser } from "../controllers/LoginController";
import User from "../models/User";
import UserService from "../services/UserService";
import ServiceToken, { stringToServiceToken } from "../token/Token";
import ServiceResponse from "./ServiceResponse";

export enum LoginStep {
  PrivacyPolicy,
  GDPR,
  Login,
}

/**
 * ISession interface adds support for new keys in the Express.Session interface.
 */
interface ISession extends Express.Session {
  user?: ISessionUser;
  loginStep?: LoginStep;
  /**
   * User requested keys
   */
  keys: Array<{ name: string; value: string }>;
}

export interface IASRequest extends express.Request {
  authorization: {
    user: User;
    token: ServiceToken;
  };

  session?: ISession;
}

class AuthorizeMiddleware {
  public authorize = (
    returnAsJson: boolean,
  ): ((req: IASRequest, res: express.Response, next: express.NextFunction) => void) => async (
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<express.Response | void> => {
    const token = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken = stringToServiceToken(token.slice(7).toString());
        const user = await UserService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user,
        };
        return next();
      } catch (e) {
        if (returnAsJson) {
          return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
        } else {
          return res.status(e.httpStatusCode || 500).render("serviceError", {
            error: e.message,
          });
        }
      }
    } else if (req.cookies.token) {
      try {
        const parsedToken = stringToServiceToken(req.cookies.token);
        const user = await UserService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user,
        };
        return next();
      } catch (e) {
        if (returnAsJson) {
          return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
        } else {
          return res.status(e.httpStatusCode || 500).render("serviceError", {
            error: e.message,
          });
        }
      }
    } else {
      if (returnAsJson) {
        return res.status(401).json(new ServiceResponse(null, "Unauthorized"));
      } else {
        return res.status(401).render("serviceError", {
          error: "Unauthorized",
        });
      }
    }
  };

  public async loadToken(
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<express.Response | void> {
    const token = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken = stringToServiceToken(token.slice(7).toString());
        const user = await UserService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user,
        };
        return next();
      } catch (e) {
        return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
      }
    }

    if (req.cookies.token) {
      try {
        const parsedToken = stringToServiceToken(req.cookies.token);
        const user = await UserService.fetchUser(parsedToken.userId);
        req.authorization = {
          token: parsedToken,
          user,
        };
        return next();
      } catch (e) {
        return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
      }
    }
    return next();
  }
}

export default new AuthorizeMiddleware();

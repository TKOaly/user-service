import * as express from "express";
import { Env } from "../env";
import UserService from "../services/UserService";
import { stringToServiceToken } from "../token/Token";
import ServiceResponse from "./ServiceResponse";

export enum LoginStep {
  PrivacyPolicy,
  GDPR,
  Login,
}

export const AuthorizeMiddleware = (env: Env) => ({
  authorize: (
    returnAsJson: boolean,
  ): ((req: express.Request, res: express.Response, next: express.NextFunction) => void) => async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const token = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken = stringToServiceToken(token.slice(7).toString(), env.JWT_SECRET);
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
        const parsedToken = stringToServiceToken(req.cookies.token, env.JWT_SECRET);
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
  },

  loadToken: async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<express.Response | void> => {
    const token = req.get("authorization");
    if (token && token.toString().startsWith("Bearer ")) {
      try {
        const parsedToken = stringToServiceToken(token.slice(7).toString(), env.JWT_SECRET);
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
        const parsedToken = stringToServiceToken(req.cookies.token, env.JWT_SECRET);
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
  },
});

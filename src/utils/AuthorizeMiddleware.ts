import * as express from "express";
import { Session } from "express-session";
import { ISessionUser } from "../controllers/LoginController";
import User from "../models/User";
import UserService from "../services/UserService";
import ServiceToken, { stringToServiceToken } from "../token/Token";
import ServiceResponse from "./ServiceResponse";
import AuthenticationService from "../services/AuthenticationService";

export enum LoginStep {
  PrivacyPolicy,
  GDPR,
  Login,
}

/**
 * ISession interface adds support for new keys in the Express.Session interface.
 */
interface ISession extends Session {
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

  session: ISession;
}

class AuthorizeMiddleware {
  public authorize =
    (returnAsJson: boolean): ((req: IASRequest, res: express.Response, next: express.NextFunction) => void) =>
    async (req: IASRequest, res: express.Response, next: express.NextFunction): Promise<express.Response | void> => {
      const headerValue = req.get("authorization");

      if (headerValue) {
        const [authType, authValue] = headerValue.split(/\s+/, 2);

        if (authType.toLowerCase() === "bearer") {
          try {
            const parsedToken = stringToServiceToken(authValue);
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
        } else if (authType.toLowerCase() === "basic") {
          const decoded = Buffer.from(authValue, "base64").toString("utf-8");
          const [serviceId, secret] = decoded.split(":", 2);

          const service = await AuthenticationService.getServiceWithIdentifier(serviceId);

          if (service.secret !== secret) {
            if (returnAsJson) {
              return res.status(403).json(new ServiceResponse(null, "Invalid credentials."));
            } else {
              return res.status(403).render("serviceError", {
                error: "Invalid credentials.",
              });
            }
          }

          req.authorization = {
            token: new ServiceToken(-1, [serviceId], new Date()),
            user: new User({
              id: -1,
              username: serviceId,
              name: "",
              screen_name: "",
              email: "",
              residence: "",
              phone: "",
              hyy_member: 1,
              membership: "kunniajasen",
              role: "yllapitaja",
              salt: "",
              hashed_password: "",
              password_hash: "",
              created: new Date(),
              modified: new Date(),
              tktl: 1,
              deleted: 0,
              hy_staff: 1,
              hy_student: 1,
              tktdt_student: 1,
              last_seq: 0,
            }),
          };

          return next();
        }
      } else if (headerValue && headerValue.toString().startsWith("Basic ")) {
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

import * as express from "express";
import ServiceResponse from "./ServiceResponse";
import { stringToServiceToken, ServiceToken } from "../token/Token";
import UserService from "../services/UserService";
import User from "../models/User";

interface IASRequest extends express.Request {
  authorization: {
    user: User,
    token: ServiceToken
  }
}

export default class AuthorizeMiddleware {
  constructor(private userService: UserService) {}

  async authorize(
    req: IASRequest,
    res: express.Response,
    next: express.NextFunction
  ) {
    let token = req.headers["authorization"];
    if (!token || !token.toString().startsWith("Bearer ")) {
      return res.status(401).json(new ServiceResponse(null, "Unauthorized"));
    } else {
      try {
        let parsedToken = stringToServiceToken(token.slice(7).toString());
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        }
        return next();
      } catch (e) {
        return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
      }
    }
  } 

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
        }
        return next();
      } catch (e) {
        return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
      }
    }
  
    if (req.cookies.token) {
      try {
        let parsedToken = stringToServiceToken(req.cookies.token);
        let user = await this.userService.fetchUser(parsedToken.userId);
        req.authorization = {
          user,
          token: parsedToken
        }
        return next();
      } catch (e) {
        return res.status(e.httpStatusCode || 500).json(new ServiceResponse(null, e.message));
      }
    }
    return next();
  }
}

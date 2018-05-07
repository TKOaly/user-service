import * as express from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import User from '../models/User';
import UserService from '../services/UserService';
import { URL } from 'url';
import Service from "../models/Service";
import { IController } from "./IController";

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController implements IController {
  route: express.Router;
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {
    this.route = express.Router();
  }

  async authenticate(req: any, res: express.Response) {
    let body: {
      serviceName: string,
      redirectTo: string,
      permission: string,
      userId: number,
      username: string,
      password: string
    } = req.body;

    if (!body.serviceName || !body.redirectTo || !body.permission || !body.userId || !body.username || !body.password) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }

    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(body.username, body.password, 'role');
    } catch(e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    let token: string;

    try {
      if (req.authorization) {
        token = this.authService.appendNewServiceAuthenticationToToken(req.authorization, body.serviceName)
      } else {
        token = this.authService.createToken(body.userId, user.role, [body.serviceName]);
      }
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }

    return res.status(200).json(new ServiceResponse({ token, redirectTo: body.redirectTo }, 'Success'));
  }

  async vanillaAuthenticate(req: any, res: express.Response) {
    let body: {
      serviceName: string,
      redirectTo: string,
      permission: string,
      userId: number,
      username: string,
      password: string
    } = req.body;

    if (!body.serviceName || !body.redirectTo || !body.permission || !body.userId || !body.username || !body.password) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }

    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(body.username, body.password, 'role');
    } catch(e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    let token: string;

    try {
      if (req.authorization) {
        token = this.authService.appendNewServiceAuthenticationToToken(req.authorization, body.serviceName)
      } else {
        token = this.authService.createToken(body.userId, user.role, [body.serviceName]);
      }
    } catch (e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }

    res.cookie('token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: new URL(req.body.redirectTo).hostname,
      secure: true
    });

    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.redirect(req.body.redirectTo);
  }

  async requestPermissions(req: any, res: express.Response) {
    if (
      !req.body.serviceName ||
      !req.body.redirectTo ||
      !req.body.username ||
      !req.body.password
    ) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "Invalid POST params"));
    }

    if (req.authorization) {
      if (req.authorization.authenticatedTo.indexOf(req.body.serviceName) > -1) {
        return res.redirect(req.body.redirectTo);
      }
    }

    let keys = [];
    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(
        req.body.username,
        req.body.password
      );
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    let service: Service;

    try {
      service = await this.authService.getService(req.body.serviceName);
    } catch (e) {
      return res
        .status(e.httpErrorCode)
        .json(new ServiceResponse(null, e.message));
    }

    Object.keys(user).forEach((key, idx) => {
      // We always need the users role so that's why we include 1024
      if ((Math.pow(2, idx) & service.dataPermissions | 1024) == Math.pow(2, idx)) {
        keys.push({
          name: key,
          value: user[key]
        });
      }
    });

    res.render('gdpr', {
      userId: user.id,
      personalInformation: keys,
      serviceName: service.serviceName,
      redirectTo: req.body.redirectTo || ''
    });
  }

  createRoutes() {
    this.route.post("/authenticate", this.authenticate.bind(this));
    this.route.post(
      "/vanillaAuthenticate",
      this.vanillaAuthenticate.bind(this)
    );
    this.route.post("/requestPermissions", this.requestPermissions.bind(this));
    return this.route;
  }
}

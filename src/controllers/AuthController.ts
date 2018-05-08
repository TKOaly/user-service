import * as express from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import User from '../models/User';
import UserService from '../services/UserService';
import { URL } from 'url';
import Service from "../models/Service";
import { IController } from "./IController";
import { loadToken } from "../utils/Authorize";

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

    if (!body.permission) {
      res.redirect('https://members.tko-aly.fi');
    }

    let user: User;
    try {
      user = await this.userService.getUserWithUsernameAndPassword(body.username, new Buffer(body.password, 'base64').toString());
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
      domain: 'localhost'
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
      if ((Math.pow(2, idx) & (service.dataPermissions | 512)) == Math.pow(2, idx)) {
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
      redirectTo: req.body.redirectTo || '',
      username: req.body.username,
      password: new Buffer(req.body.password).toString('base64')
    });
  }

  createRoutes() {
    this.route.post(
      "/vanillaAuthenticate",
      loadToken,
      this.vanillaAuthenticate.bind(this)
    );
    this.route.post(
      "/requestPermissions", 
      loadToken, 
      this.requestPermissions.bind(this));
    return this.route;
  }
}

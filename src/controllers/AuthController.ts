import * as express from "express";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import User from '../models/User';
import UserService from '../services/UserService';
import { URL } from 'url';

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController {
  route: express.Router;
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {
    this.route = express.Router();
  }

  async authenticate(req: express.Request, res: express.Response) {
    let body: { 
      permissionVal: number, 
      redirectTo: string,
      permission: string,
      userId: number } = req.body;
    if (!body.permissionVal || !body.redirectTo || !body.permission || !body.userId) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }
    let token: string;
    try {
      token = this.authService.createToken(body.userId, body.permissionVal);
    } catch(e) {
      return res.status(500).json(new ServiceResponse(null, e.message));
    }
    return res.status(200).json(new ServiceResponse({ token, redirectTo: body.redirectTo }, 'Success'));
  }

  async vanillaAuthenticate(req: express.Request, res: express.Response) {
    if (!req.body.permissionVal || !req.body.redirectTo || !req.body.permission || !req.body.userId) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }
    let token: string;
    try {
      token = this.authService.createToken(req.body.userId, req.body.permissionVal);
    } catch(e) {
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

  async requestPermissions(req: express.Request, res: express.Response) {
    if (
      !req.body.permissionVal ||
      !req.body.redirectTo ||
      !req.body.username ||
      !req.body.password
    ) {
      return res
        .status(400)
        .json(new ServiceResponse(null, "Invalid POST params"));
    }
    let keys = [];
    let user = await this.userService.getUserWithUsernameAndPassword(
      req.body.username,
      req.body.password
    );
    if (!user) {
      return res
        .status(404)
        .json(new ServiceResponse(null, "Invalid username or password."));
    }

    Object.keys(user).forEach((key, idx) => {
      if ((Math.pow(2, idx) & req.body.permissionVal) == Math.pow(2, idx)) {
        keys.push({
          name: key,
          value: user[key]
        });
      }
    });

    res.render('gdpr', {
      userId: user.id,
      personalInformation: keys,
      serviceName: req.get('referer'),
      redirectTo: req.body.redirectTo || '',
      permissionVal: req.body.permissionVal || ''
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

import * as express from 'express';
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import User from '../models/User';
import UserService from '../services/UserService';

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController {
  route: express.Router;
  constructor(private authService: AuthenticationService, private userService: UserService) {
    this.route = express.Router();
  }

  async authenticate(req: express.Request, res: express.Response) {
    let body: { username: string, password: string } = req.body;
    if (!body.username && !body.password) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }

    try {
      let token = await this.authService.fetchToken(body.username, body.password);
      res.status(200).json(new ServiceResponse(token));
    } catch(exception) {
      return res.status(exception.httpErrorCode || 500).json(new ServiceResponse(null, exception.message));
    }
  }

  async vanillaAuthenticate(req: express.Request, res: express.Response) {
    
  }

  async requestPermissions(req: express.Request, res: express.Response) {
    if (!req.body.permissionVal || !req.body.redirectTo || !req.body.username || !req.body.password) {
      return res.status(400).json(new ServiceResponse(null, 'Invalid POST params'));
    }
    let keys = [];
    let user = await this.userService.getUserWithUsernameAndPassword(req.body.username, req.body.password);
    if (!user) {
      return res.status(404).json(new ServiceResponse(null, 'Invalid username or password.'));
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
      personalInformation: keys,
      serviceName: req.get('referer')
    });
  }

  createRoutes() {
    this.route.post('/authenticate', this.authenticate.bind(this));
    this.route.post('/vanillaAuthenticate', this.vanillaAuthenticate.bind(this));
    this.route.post('/requestPermissions', this.requestPermissions.bind(this));
    return this.route;
  }
}
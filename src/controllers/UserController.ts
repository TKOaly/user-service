import * as express from 'express';
import UserService from "../services/UserService";
import AuthenticationService from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import {} from '../models/User';

/**
 * @param {UserService} userService
 */
export default class UserController {
  route: express.Router;

  constructor(
    private userService: UserService, 
    private authenticationService: AuthenticationService) {
      this.route = express.Router();
    }

    async getMe(req: express.Request, res: express.Response) {
      let token = req.headers['authorization'];
      if (!token || !token.toString().startsWith('Bearer ')) {
        return res.status(401).json(new ServiceResponse(null, 'Unauthorized'));
      }

      if (!req.query.dataRequest) {
        return res.status(400).json(new ServiceResponse(null, 'Missing data request query'));
      }

      let dataRequest: number = Number(req.query.dataRequest)
      try {
        let tokenPayload = this.authenticationService.verifyToken(token.toString().substring(7));
        let user = await this.userService.fetchUser(tokenPayload.userId);
        res.status(200).json(new ServiceResponse(user.removeNonRequestedData(dataRequest)));
      } catch(e) {
        res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
      }
      
    }

    createRoutes() {
      this.route.get('/me', this.getMe.bind(this));
      return this.route;
    }
}

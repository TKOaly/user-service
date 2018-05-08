import * as express from 'express';
import UserService from "../services/UserService";
import { AuthenticationService } from "../services/AuthenticationService";
import ServiceResponse from '../utils/ServiceResponse';
import User from '../models/User';
import { authorize } from '../utils/Authorize';
import { IController } from './IController';

/**
 * @param {UserService} userService
 */
export default class UserController implements IController {
  route: express.Router;

  constructor(
    private userService: UserService, 
    private authenticationService: AuthenticationService) {
      this.route = express.Router();
    }

    async getMe(req: any, res: express.Response) {
      if (!req.query.dataRequest) {
        return res.status(400).json(new ServiceResponse(null, 'Missing data request query'));
      }

      let dataRequest: number = Number(req.query.dataRequest)
      try {
        let user = await this.userService.fetchUser(req.authorization.userId);
        res.status(200).json(new ServiceResponse(user.removeNonRequestedData(dataRequest)));
      } catch(e) {
        res.status(e.httpErrorCode).json(new ServiceResponse(null, e.message));
      }
      
    }

    async getAllUsers(req: any, res: express.Response) {
      if (req.authorization.userRole != 'yllapitaja') {
        return res.status(403).json(new ServiceResponse(null, 'Forbidden'));
      }

      try {
        let users = await this.userService.fetchAllUsers();
        return res.status(200).json(new ServiceResponse(users.map(u => u.removeSensitiveInformation())))
      } catch(e) {
        res.status(500).json(new ServiceResponse(null, e.message));
      }
    }

    async modifyMe(req: express.Request, res: express.Response) {

    }

    async createUser(req: express.Request, res: express.Response) {

    }

    createRoutes() {
      this.route.get('/me', authorize, this.getMe.bind(this));
      this.route.get('/', authorize, this.getAllUsers.bind(this));
      this.route.patch('/me', authorize, this.modifyMe.bind(this));
      this.route.post('/', this.createUser.bind(this));
      return this.route;
    }
}

import * as express from 'express';
import UserService from "../services/UserService";
import AuthenticationService from "../services/AuthenticationService";

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
        return res.status(401).json({
          message: 'Unauthorized'
        });
      }

      try {
        let tokenPayload = this.authenticationService.verifyToken(token.toString().substring(7));
        let user = await this.userService.fetchUser(tokenPayload.userId);
        res.status(200).json({
          message: 'Success',
          payload: user.removeSensitiveInformation()
        });
      } catch(e) {
        res.status(e.httpErrorCode).json({
          message: e.message
        });
      }
      
    }

    createRoutes() {
      this.route.get('/me', this.getMe.bind(this));
      return this.route;
    }
}

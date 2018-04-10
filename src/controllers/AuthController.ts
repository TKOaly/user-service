import * as express from 'express';
import AuthenticationService from "../services/AuthenticationService";

/**
 * @param {AuthenticatioService} authenticationService
 */
export default class AuthController {
  route: express.Router;
  constructor(private authService: AuthenticationService) {
    this.route = express.Router();
  }

  async authenticate(req: express.Request, res: express.Response) {
    let body: { username: string, password: string } = req.body;
    if (!body.username && !body.password) {
      return res.status(400).json({
        message: 'Invalid POST params'
      });
    }

    try {
      let token = await this.authService.fetchToken(body.username, body.password);
      res.status(200).json({
        message: 'Success',
        payload: {
          token
        }
      });
    } catch(exception) {
      return res.status(exception.httpErrorCode).json({
        message: exception.message
      });
    }
  }

  createRoutes() {
    this.route.post('/authenticate', this.authenticate.bind(this));
    return this.route;
  }
}
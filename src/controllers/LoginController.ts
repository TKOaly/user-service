import { IController } from "./IController";
import { Response, Router } from 'express';
import { AuthenticationService } from "../services/AuthenticationService";
import Service from "../models/Service";

export default class LoginController implements IController {
  route: Router;

  constructor(private authService: AuthenticationService) {
    this.route = Router();
  }

  async getLoginView(req: any, res: Response) {
    if (!req.query.serviceIdentifier) {
      return res.status(400).send("Service identifier missing");
    }
  
    try {
      const service: Service = await this.authService.getServiceWithIdentifier(
        req.query.serviceIdentifier
      );
      return res.render("login", { service });
    } catch (err) {
      return res.status(400).send(err.message);
    }
  }

  createRoutes() {
    this.route = this.route.get('/', this.getLoginView.bind(this));
    return this.route;
  }
}
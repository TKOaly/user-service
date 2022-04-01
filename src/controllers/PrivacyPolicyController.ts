import Express from "express";
import PrivacyPolicyDao from "../dao/PrivacyPolicyDao";
import * as Sentry from "@sentry/node";
import Controller from "../interfaces/Controller";
import ServiceResponse from "../utils/ServiceResponse";

class PrivacyPolicyController implements Controller {
  private route: Express.Router;

  constructor() {
    this.route = Express.Router();
  }

  public async GetPrivacyPolicy(req: Express.Request, res: Express.Response): Promise<Express.Response | void> {
    try {
      const privacyPolicy = await PrivacyPolicyDao.findByServiceIdentifier(req.params.serviceIdentifier);
      if (privacyPolicy) {
        return res.status(200).json(new ServiceResponse(privacyPolicy, "Success", true));
      } else {
        return res.status(404).json(new ServiceResponse(null, "Privacy policy not found", false));
      }
    } catch (err) {
      Sentry.captureException(err);
      return res.status(500).json(new ServiceResponse(null, "Server error", false));
    }
  }

  public createRoutes(): Express.Router {
    this.route.get("/:serviceIdentifier", this.GetPrivacyPolicy.bind(this));

    return this.route;
  }
}

export default new PrivacyPolicyController();

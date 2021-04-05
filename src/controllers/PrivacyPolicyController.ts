import Express from "express";
import PrivacyPolicyDao from "../dao/PrivacyPolicyDao";
import Raven from "raven";
import Controller from "../interfaces/Controller";
import ServiceResponse from "../utils/ServiceResponse";

export class PrivacyPolicyController implements Controller {
  private route: Express.Router;

  constructor() {
    this.route = Express.Router();
  }

  public createRoutes() {
    this.route.get("/:serviceIdentifier", async (req: Express.Request, res: Express.Response) => {
      try {
        const privacyPolicy = await PrivacyPolicyDao.findByServiceIdentifier(req.params.serviceIdentifier);
        if (privacyPolicy) {
          return res.status(200).json(new ServiceResponse(privacyPolicy, "Success", true));
        } else {
          return res.status(404).json(new ServiceResponse(null, "Privacy policy not found", false));
        }
      } catch (err) {
        Raven.captureException(err);
        return res.status(500).json(new ServiceResponse(null, "Server error", false));
      }
    });
    return this.route;
  }
}

import * as Express from "express";
import PrivacyPolicyDao from "../dao/PrivacyPolicyDao";
import IController from "../interfaces/IController";
import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";
import ServiceResponse from "../utils/ServiceResponse";

export default class PrivacyPolicyController implements IController {
  private route: Express.Router;

  constructor(private readonly privacyPolicyDao: PrivacyPolicyDao) {
    this.route = Express.Router();
  }

  public async GetPrivacyPolicy(
    req: Express.Request,
    res: Express.Response
  ): Promise<Express.Response | void> {
    try {
      const privacyPolicy: IPrivacyPolicyDatabaseObject = await this.privacyPolicyDao.findByServiceIdentifier(
        req.params.serviceIdentifier
      );
      if (privacyPolicy) {
        return res
          .status(200)
          .json(new ServiceResponse(privacyPolicy, "Success", true));
      } else {
        return res
          .status(404)
          .json(new ServiceResponse(null, "Privacy policy not found", false));
      }
    } catch (err) {
      return res
        .status(500)
        .json(new ServiceResponse(null, "Server error", false));
    }
  }

  public createRoutes(): Express.Router {
    this.route.get("/:serviceIdentifier", this.GetPrivacyPolicy.bind(this));

    return this.route;
  }
}

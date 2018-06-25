import * as express from "express";
import PricingService from "../services/PricingService";
import { IController } from "./IController";

export default class PricingController implements IController {
  public route: express.Router;

  constructor(private readonly pricingService: PricingService) {
    this.route = express.Router();
  }

  public async getAllPricings(
    req: express.Request,
    res: express.Response
  ): Promise<express.Response | void> {
    return res.status(200).json({});
  }

  public createRoutes(): express.Router {
    throw new Error("Method not implemented.");
  }
}

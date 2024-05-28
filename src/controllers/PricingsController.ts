import { RequestHandler, Router } from "express";
import PricingDao from "../dao/PricingDao";
import { MembershipType, PUBLIC_MEMBERSIHP_TYPES } from "../enum/Membership";
import Controller from "../interfaces/Controller";
import Pricing from "../models/Pricing";
import ServiceError from "../utils/ServiceError";
import ServiceResponse from "../utils/ServiceResponse";

const isMembershipType = (value: string): value is MembershipType =>
  (PUBLIC_MEMBERSIHP_TYPES as string[]).includes(value);

class UserController implements Controller {
  findPricings: RequestHandler = async (req, res) => {
    let membership: MembershipType | null = null;
    let seasons: number | null = null;

    if (req.query.membership) {
      if (typeof req.query.membership !== "string") {
        throw new ServiceError(400, 'invalid value for query parameter "membership"');
      }

      if (!isMembershipType(req.query.membership)) {
        throw new ServiceError(400, 'query parameter "membership" required');
      }

      membership = req.query.membership;
    }

    if (req.query.seasons) {
      try {
        seasons = parseInt(req.query.seasons.toString(), 10);
      } catch (err) {
        throw new ServiceError(400, 'invalid value for query parameter "seasons"');
      }
    }

    const prices = await PricingDao.findPrices(membership, seasons);

    const result = prices.map(price => new Pricing(price));

    res.json(new ServiceResponse(result, "prices found", true));
  };

  getCurrentSeason: RequestHandler = async (req, res) => {
    const getDate = (month: number, day: number, future: boolean) => {
      const date = new Date();
      date.setMonth(month);
      date.setDate(day);

      if (date.valueOf() >= Date.now() !== future) {
        date.setFullYear(date.getFullYear() + (future ? 1 : -1));
      }

      if (future) {
        date.setHours(23);
        date.setMinutes(59);
      } else {
        date.setHours(0);
        date.setMinutes(0);
      }

      return date;
    };

    res.json(
      new ServiceResponse({
        start: getDate(7, 1, false),
        end: getDate(6, 31, true),
      }),
    );
  };

  public createRoutes() {
    const router = Router();

    router.get("/find", this.findPricings);
    router.get("/season", this.getCurrentSeason);

    return router;
  }
}

export default new UserController();

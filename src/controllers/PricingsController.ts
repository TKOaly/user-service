import express, { RequestHandler, Router } from "express";
import PricingDao from "../dao/PricingDao";
import { MembershipType, PUBLIC_MEMBERSIHP_TYPES } from "../enum/Membership";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import Pricing from "../models/Pricing";
import AuthorizeMiddleware, { IASRequest } from "../utils/AuthorizeMiddleware";
import ServiceError from "../utils/ServiceError";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";

type IASRequestHandler = (req: IASRequest, res: express.Response, next: express.NextFunction) => void;

const getActiveSeason = () => {
  const date = new Date();
  date.setMonth(7);
  date.setDate(1);
  date.setHours(0);
  date.setMinutes(0);

  if (date.valueOf() >= Date.now()) {
    return date.getFullYear() - 1;
  }

  return date.getFullYear();
};

const isMembershipType = (value: string): value is MembershipType =>
  (PUBLIC_MEMBERSIHP_TYPES as string[]).includes(value);

type UpdateSeasonPricesBody = {
  clear?: boolean;
  prices: {
    seasons: number;
    membership: MembershipType;
    price: number;
  }[];
};

const validateUpdateSeasonPricesBody = (body: any): body is UpdateSeasonPricesBody => {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  if (!("prices" in body)) {
    return false;
  }

  if (!Array.isArray(body.prices)) {
    return false;
  }

  if ("clear" in body && typeof body.clear !== "boolean") {
    return false;
  }

  const validateItem = (item: any) => {
    if (typeof item !== "object" || item === null) return false;

    if (typeof item.membership !== "string" || typeof item.price !== "number" || typeof item.seasons !== "number") {
      return false;
    }

    return true;
  };

  if (body.prices.some((item: any) => !validateItem(item))) {
    return false;
  }

  return true;
};

const parseSeason = (season: string | undefined) => {
  if (!season || season === "current") {
    return getActiveSeason();
  } else if (season === "next") {
    return getActiveSeason() + 1;
  }

  return parseInt(season, 10);
};

class UserController implements Controller {
  findPricings: RequestHandler = async (req, res) => {
    let membership: MembershipType | null = null;
    let seasons: number | null = null;

    const season = parseSeason(req.params.season);

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

    const prices = await PricingDao.findPrices(membership, seasons, season);

    const result = prices.map(price => new Pricing(price));

    res.json(new ServiceResponse(result, "prices found", true));
  };

  getSeason: RequestHandler = async (req, res) => {
    const season = parseSeason(req.params.season);

    const getDate = (month: number, day: number, future: boolean) => {
      const date = new Date();
      date.setMonth(month);
      date.setDate(day);

      if (future) {
        date.setFullYear(season + 1);
        date.setHours(23);
        date.setMinutes(59);
      } else {
        date.setFullYear(season);
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

  updateSeasonPrices: IASRequestHandler = async (req, res) => {
    if (compareRoles(req.authorization.user.role, UserRoleString.Jasenvirkailija) < 0) {
      res.status(403).json(new ServiceResponse(null, "Forbidden"));
      return;
    }

    const season = parseSeason(req.params.season);

    console.log(req.body);

    if (!validateUpdateSeasonPricesBody(req.body)) {
      res.status(400).json(new ServiceResponse(null, "Invalid request body"));
      return;
    }

    if (req.body.clear) {
      await PricingDao.deleteSeasonPrices(season);
    }

    await Promise.all(
      req.body.prices.map(async ({ membership, seasons, price }) => {
        await PricingDao.updatePrice(season, membership, seasons, price);
      }),
    );

    res.json(new ServiceResponse(null));
  };

  public createRoutes() {
    const router = Router();

    router.get("/season/:season(\\d+|next|current)?", this.getSeason);
    router.get("/prices/:season(\\d+|next|current)?", this.findPricings);
    router.patch(
      "/prices/:season(\\d+|next|current)?",
      AuthorizeMiddleware.authorize(true) as RequestHandler,
      this.updateSeasonPrices as RequestHandler,
    );

    return router;
  }
}

export default new UserController();

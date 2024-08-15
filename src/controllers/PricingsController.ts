import { RequestHandler, Router } from "express";
import PricingDao from "../dao/PricingDao";
import { MembershipType } from "../enum/Membership";
import UserRoleString from "../enum/UserRoleString";
import Controller from "../interfaces/Controller";
import PricingService, { Season } from "../services/PricingService";
import AuthorizeMiddleware, { AuthorizedRequestHandler } from "../utils/AuthorizeMiddleware";
import ServiceError from "../utils/ServiceError";
import ServiceResponse from "../utils/ServiceResponse";
import { compareRoles } from "../utils/UserHelpers";

const isMembershipType = (value: string): value is MembershipType =>
  ["jasen", "kannatusjasen", "kunniajasen", "ulkojasen"].includes(value);

type UpdateSeasonPricesBody = {
  clear?: boolean;
  prices: {
    seasons: number;
    membership: MembershipType;
    price: number;
  }[];
};

const validateUpdateSeasonPricesBody = (body: unknown): body is UpdateSeasonPricesBody => {
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

  const validateItem = (item: unknown) => {
    if (typeof item !== "object" || item === null) return false;

    if (
      !("membership" in item) ||
      typeof item.membership !== "string" ||
      !("price" in item) ||
      typeof item.price !== "number" ||
      !("seasons" in item) ||
      typeof item.seasons !== "number"
    ) {
      return false;
    }

    return true;
  };

  if (body.prices.some(item => !validateItem(item))) {
    return false;
  }

  return true;
};

const parseSeason = (season: string | undefined) => {
  if (!season || season === "current") {
    return PricingService.getSeason();
  } else if (season === "next") {
    return PricingService.getSeason(1);
  }

  return parseInt(season, 10);
};

class UserController implements Controller {
  findPricings: RequestHandler = async (req, res) => {
    let membership: MembershipType | null = null;
    let seasons: number | null = null;

    let season: Season;

    if (req.params.season === "next" || req.params.season === "current") {
      season = req.params.season;
    } else if (req.params.season) {
      try {
        season = parseInt(req.params.season.toString(), 10);
      } catch {
        throw new ServiceError(400, 'invalid value for route parameter "season"');
      }
    } else {
      season = "current";
    }

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
        if (!(err instanceof ServiceError)) {
          throw err;
        }

        throw new ServiceError(400, 'invalid value for query parameter "seasons"');
      }
    }

    const result = await PricingService.findPricings(season, membership, seasons);

    res.json(new ServiceResponse(result, "prices found", true));
  };

  getSeason: RequestHandler = async (req, res) => {
    const result = await PricingService.getSeasonInfo(parseSeason(req.params.season));
    res.json(new ServiceResponse(result));
  };

  updateSeasonPrices: AuthorizedRequestHandler = async (req, res) => {
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
      AuthorizeMiddleware.authorize(true),
      this.updateSeasonPrices as RequestHandler,
    );

    return router;
  }
}

export default new UserController();

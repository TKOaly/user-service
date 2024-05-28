import PricingDao from "../dao/PricingDao";
import { MembershipType } from "../enum/Membership";
import Pricing from "../models/Pricing";

export type Season = number | "current" | "next";

export const getSeason = (offset = 0) => {
  const date = new Date();
  date.setMonth(7);
  date.setDate(1);
  date.setHours(0);
  date.setMinutes(0);

  if (date.valueOf() >= Date.now()) {
    return date.getFullYear() - 1 + offset;
  }

  return date.getFullYear() + offset;
};

const parseSeason = (season: string | number | null) => {
  if (!season || season === "current") {
    return getSeason();
  } else if (season === "next") {
    return getSeason(1);
  }

  return parseInt(season.toString(), 10);
};

class PricingService {
  async findPricings(pSeason: Season, membership: MembershipType | null, seasons: number | null) {
    const season = parseSeason(pSeason);
    const prices = await PricingDao.findPrices(membership, seasons, season);
    return prices.map(price => new Pricing(price));
  }

  getSeason(offset = 0) {
    const date = new Date();
    date.setMonth(7);
    date.setDate(1);
    date.setHours(0);
    date.setMinutes(0);

    if (date.valueOf() >= Date.now()) {
      return date.getFullYear() - 1 + offset;
    }

    return date.getFullYear() + offset;
  }

  async getSeasonInfo(pSeason: Season) {
    const season = parseSeason(pSeason);

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

    return {
      start: getDate(7, 1, false),
      end: getDate(6, 31, true),
    };
  }
}

export default new PricingService();

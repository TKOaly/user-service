import { RequestHandler } from "express";
import { Env } from "../env";

const localizationMiddleware = (env: Env): RequestHandler => (req, res, next): void => {
  if (req.cookies.tkoaly_locale === undefined) {
    res.cookie("tkoaly_locale", env.DEFAULT_LOCALE, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: env.COOKIE_DOMAIN,
    });
  }
  next();
};

export default localizationMiddleware;

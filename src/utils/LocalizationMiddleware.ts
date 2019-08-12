import { RequestHandler } from "express";

const localizationMiddleware: RequestHandler = (req, res, next): void => {
  if (req.cookies.tkoaly_locale === undefined) {
    res.cookie("tkoaly_locale", process.env.DEFAULT_LOCALE, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN,
    });
  }
  next();
};

export default localizationMiddleware;

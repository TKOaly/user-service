import * as Express from "express";

const localizationMiddleware = (
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): void => {
  if (req.cookies.tkoaly_locale === undefined) {
    res.cookie("tkoaly_locale", process.env.DEFAULT_LOCALE, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: process.env.COOKIE_DOMAIN
    });
  }
  next();
};

export default localizationMiddleware;

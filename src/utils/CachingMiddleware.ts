import * as Express from "express";

/**
 * A middleware that disables caching.
 */
// tslint:disable-next-line:typedef
const cachingMiddleware = (
  req: Express.Request | any,
  res: Express.Response | any,
  next: Express.NextFunction | any
): void => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};

export default cachingMiddleware;

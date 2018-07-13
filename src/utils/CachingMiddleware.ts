import * as Express from "express";

/**
 * Caching middleware.
 * Disables caching.
 *
 * @param {Express.Request | any} req Express request
 * @param {Express.Response | any} res Express response
 * @param {Express.NextFunction | any} next Express NextFunction
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

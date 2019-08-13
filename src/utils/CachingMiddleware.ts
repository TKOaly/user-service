import { RequestHandler } from "express";

/**
 * A middleware which disables caching
 *
 */
const cachingMiddleware: RequestHandler = (req, res, next): void => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  next();
};

export default cachingMiddleware;

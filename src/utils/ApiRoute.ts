import { Request, Response, NextFunction } from "express";

/**
 * Generates an API route in the format /api/{API_VERSION}/{ENDPOINT_NAME} or /api/{ENDPOINT_NAME}
 * depending on if API version is not set.
 *
 * @param apiVersion API version. Defaults to null, can be configured manually.
 * @returns API route, example: /api/v1/users
 */
export function generateApiRoute(endpointName: string, apiVersion?: string) {
  if (!apiVersion) {
    return `/api/${endpointName}`;
  } else {
    return `/api/${apiVersion}/${endpointName}`;
  }
}

/**
 * API header middleware that sets headers.
 */
export function apiHeaderMiddleware(apiVersion?: string): (req: Request, res: Response, next: NextFunction) => void {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (apiVersion) {
      res.setHeader("X-Route-API-version", apiVersion);
    }
    if (process.env.API_VERSION === undefined) {
      throw new Error("API_VERSION environment variable is not defined.");
    }
    res.setHeader("X-API-version", process.env.API_VERSION);
    next();
  };
}

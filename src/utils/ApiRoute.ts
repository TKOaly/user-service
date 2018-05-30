import * as Express from "express";

/**
 * Generates an API route in the format /api/{API_VERSION}/{ENDPOINT_NAME} or /api/{ENDPOINT_NAME} depending on if API version is not set.
 *
 * @export
 * @param {string} endpointName Endpoint name
 * @param {string} [apiVersion] API version. Defaults to null, can be configured manually.
 * @returns {string} API route, example: /api/v1/users
 */
function generateApiRoute(endpointName: string, apiVersion?: string): string {
  if (!apiVersion) {
    return "/api/" + endpointName;
  } else {
    return "/api/" + apiVersion + "/" + endpointName;
  }
}
/**
 * API header middleware that sets headers.
 *
 * @param {string} [apiVersion] API version
 * @returns
 */
function apiHeaderMiddleware(apiVersion?: string) {
  return function(
    req: Express.Request | any,
    res: Express.Response | any,
    next: Express.NextFunction | any
  ) {
    if (apiVersion) {
      res.setHeader("X-Route-API-version", apiVersion);
    }
    res.setHeader("X-API-version", process.env.API_VERSION);
    next();
  };
}

export default { generateApiRoute, apiHeaderMiddleware };

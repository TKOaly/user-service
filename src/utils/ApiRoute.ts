/**
 * Generates an API route in the format /api/{API_VERSION}/{ENDPOINT_NAME} or /api/{ENDPOINT_NAME} depending on if API version is not set.
 *
 * @export
 * @param {string} endpointName Endpoint name
 * @param {string} [apiVersion] API version. Defaults to null, can be configured manually.
 * @returns {string} API route, example: /api/v1/users
 */
export function apiRoute(endpointName: string, apiVersion?: string): string {
  if (!apiVersion) {
    return "/api/" + endpointName;
  } else {
    return "/api/" + apiVersion + "/" + endpointName;
  }
}

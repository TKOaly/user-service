/**
 * Generates an API route in the format /api/{API_VERSION}/{ENDPOINT_NAME} or /api/{ENDPOINT_NAME}
 * depending on if API version is not set.
 *
 * @param apiVersion API version. Defaults to null, can be configured manually.
 * @returns API route, example: /api/v1/users
 */
export function apiRoute(endpointName: string, apiVersion?: string) {
  if (!apiVersion) {
    return `/api/${endpointName}`;
  } else {
    return `/api/${apiVersion}/${endpointName}`;
  }
}

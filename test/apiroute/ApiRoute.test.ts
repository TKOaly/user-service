import { apiHeaderMiddleware, generateApiRoute } from "../../src/utils/ApiRoute";
import { describe, test, expect } from "vitest";

process.env.NODE_ENV = "test";
process.env.API_VERSION = "v5";

describe("ApiRoute", () => {
  test("Creates API route correctly, with API version and route", () => {
    const apiVersion = "v2";
    const route = "testroute";
    const apiUrl = generateApiRoute(route, apiVersion);
    expect(apiUrl).to.equal(`/api/${apiVersion}/${route}`);
  });

  test("Creates API route correctly, with API route", () => {
    const route = "testroute";
    const apiUrl = generateApiRoute(route);
    expect(apiUrl).to.equal(`/api/${route}`);
  });

  test("Middleware sets route and API version headers correctly", () => {
    const apiVersion = "v2";

    const headers: Array<{ name: string; val: string }> = [];

    let calledNext = false;

    // Mocked express
    const mockExpress: any = {
      req: {},
      res: {
        setHeader: (name: string, val: string): void => {
          headers.push({ name, val });
        },
      },
      next: (): void => {
        calledNext = true;
      },
    };

    const middleware = apiHeaderMiddleware(apiVersion);
    // Call middleware
    middleware(mockExpress.req, mockExpress.res, mockExpress.next);

    expect(headers).to.have.length(2);
    expect(headers[0]).toBeDefined();
    expect(headers[1]).toBeDefined();

    expect(headers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "X-Route-API-version",
        val: apiVersion,
      }),
      expect.objectContaining({
        name: "X-API-version",
        val: process.env.API_VERSION,
      }),
    ]))

    expect(calledNext).to.equal(true);
  });

  test("Middleware sets API version header correctly", () => {
    const headers: Array<{ name: string; val: string }> = [];

    let calledNext = false;

    // Mocked express
    const mockExpress: any = {
      req: {},
      res: {
        setHeader: (name: string, val: string): void => {
          headers.push({ name, val });
        },
      },
      next: (): void => {
        calledNext = true;
      },
    };

    const middleware = apiHeaderMiddleware();
    // Call middleware
    middleware(mockExpress.req, mockExpress.res, mockExpress.next);

    expect(headers).toHaveLength(1);

    expect(headers).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: "X-API-version",
        val: process.env.API_VERSION,
      }),
    ]));

    expect(calledNext).to.equal(true);
  });
});

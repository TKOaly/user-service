import "mocha";
import { apiHeaderMiddleware, generateApiRoute } from "../../src/utils/ApiRoute";
process.env.NODE_ENV = "test";
process.env.API_VERSION = "v5";

import chai = require("chai");
const should = chai.should();

describe("ApiRoute", () => {
  it("Creates API route correctly, with API version and route", done => {
    const apiVersion = "v2";
    const route = "testroute";
    const apiUrl = generateApiRoute(route, apiVersion);
    apiUrl.should.equal("/api/" + apiVersion + "/" + route);
    done();
  });

  it("Creates API route correctly, with API route", done => {
    const route = "testroute";
    const apiUrl = generateApiRoute(route);
    apiUrl.should.equal("/api/" + route);
    done();
  });

  it("Middleware sets route and API version headers correctly", done => {
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

    should.exist(headers[0]);
    should.exist(headers[1]);

    headers.length.should.equal(2);
    headers[0].name.should.equal("X-Route-API-version");
    headers[0].val.should.equal(apiVersion);
    headers[1].name.should.equal("X-API-version");
    headers[1].val.should.equal(process.env.API_VERSION);
    calledNext.should.equal(true);

    done();
  });

  it("Middleware sets API version header correctly", done => {
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

    should.exist(headers[0]);
    should.not.exist(headers[1]);

    headers.length.should.equal(1);
    headers[0].name.should.equal("X-API-version");
    headers[0].val.should.equal(process.env.API_VERSION);
    calledNext.should.equal(true);

    done();
  });
});

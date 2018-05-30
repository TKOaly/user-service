process.env.NODE_ENV = "test";
process.env.API_VERSION = "v5";

import "mocha";
import { generateApiRoute, apiHeaderMiddleware } from "./../src/utils/ApiRoute";
const chai: Chai.ChaiStatic = require("chai");
const should = chai.should();

describe("ApiRoute", () => {
  it("Creates API route correctly, with API version and route", done => {
    const apiVersion: string = "v2";
    const route: string = "testroute";
    const apiUrl: string = generateApiRoute(route, apiVersion);
    apiUrl.should.equal("/api/" + apiVersion + "/" + route);
    done();
  });

  it("Creates API route correctly, with API route", done => {
    const route: string = "testroute";
    const apiUrl: string = generateApiRoute(route);
    apiUrl.should.equal("/api/" + route);
    done();
  });

  it("Middleware sets headers correctly", done => {
    const apiVersion: string = "v2";

    const headers: { name: string; val: string }[] = [];

    // Mocked express
    const mockExpress = {
      req: {},
      res: {
        setHeader: (name: string, val: string): void => {
          headers.push({ name, val });
        }
      },
      next: () => {}
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

    done();
  });
});

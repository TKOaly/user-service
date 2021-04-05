import "mocha";
import { generateApiRoute } from "../../src/utils/ApiRoute";
process.env.NODE_ENV = "test";
process.env.API_VERSION = "v5";

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
});

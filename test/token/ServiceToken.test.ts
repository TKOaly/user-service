process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret_stuff";

import chai = require("chai");
import { JsonWebTokenError } from "jsonwebtoken";
import "mocha";
import ServiceToken, { stringToServiceToken } from "../../src/token/Token";
import { calendarIdentifier, kjyrIdentifier } from "../TestUtils";
const should: Chai.Should = chai.should();

describe("ServiceToken", () => {
  it(
    "Creates service token correctly, with corrent userId," +
      " authentication list and creation date.",
    (done: Mocha.Done) => {
      const userId: number = 1;
      const authenticatedTo: string[] = [kjyrIdentifier, calendarIdentifier];
      const createdAt: Date = new Date();

      const serviceToken: ServiceToken = new ServiceToken(
        userId,
        authenticatedTo,
        createdAt
      );
      const token: string = serviceToken.toString();

      should.exist(token);
      // tslint:disable-next-line:no-unused-expression
      token.should.not.be.empty;

      done();
    }
  );
  it(
    "Should throw an exception when a malformed JWT is given",
    (done: Mocha.Done) => {
      // tslint:disable-next-line:no-unused-expression
      chai.expect(stringToServiceToken).to.throw(JsonWebTokenError);

      done();
    }
  );
});

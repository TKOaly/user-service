process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret_stuff";

import chai = require("chai");
import { JsonWebTokenError } from "jsonwebtoken";
import "mocha";
import ServiceToken, { stringToServiceToken } from "../../src/token/Token";
import { calendarIdentifier, kjyrIdentifier } from "../TestUtils";
const should: Chai.Should = chai.should();

describe("ServiceToken", () => {
  it("Creates service token correctly, with corrent userId," + " authentication list and creation date.", done => {
    const userId = 1;
    const authenticatedTo = [kjyrIdentifier, calendarIdentifier];
    const createdAt = new Date();

    const serviceToken = new ServiceToken(userId, authenticatedTo, createdAt);
    const token = serviceToken.toString();

    should.exist(token);
    // tslint:disable-next-line:no-unused-expression
    token.should.not.be.empty;

    done();
  });
  it("Should throw an exception when a malformed JWT is given", done => {
    // tslint:disable-next-line:no-unused-expression
    chai.expect(stringToServiceToken).to.throw(JsonWebTokenError);

    done();
  });
});

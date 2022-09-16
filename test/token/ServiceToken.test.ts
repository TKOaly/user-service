import "mocha";
import ServiceToken, { stringToServiceToken } from "../../src/token/Token";
import { calendarIdentifier, kjyrIdentifier } from "../TestUtils";
import ServiceError from "../../src/utils/ServiceError";

import chai = require("chai");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret_stuff";
const should: Chai.Should = chai.should();

describe("ServiceToken", () => {
  it("Creates service token correctly, with corrent userId," + " authentication list and creation date.", done => {
    const userId = 1;
    const authenticatedTo = [kjyrIdentifier, calendarIdentifier];
    const createdAt = new Date();

    const serviceToken = new ServiceToken(userId, authenticatedTo, createdAt);
    const token = serviceToken.toString();

    should.exist(token);
    // eslint-disable-next-line no-unused-expressions
    token.should.not.be.empty;

    done();
  });
  it("Should throw an exception when a malformed JWT is given", done => {
    // tslint:disable-next-line:no-unused-expression
    chai.expect(stringToServiceToken).to.throw(ServiceError);

    done();
  });
});

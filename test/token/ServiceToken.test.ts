import { describe, test, expect } from "vitest";
import ServiceToken, { stringToServiceToken } from "../../src/token/Token";
import { calendarIdentifier, kjyrIdentifier } from "../TestUtils";
import ServiceError from "../../src/utils/ServiceError";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secret_stuff";

describe("ServiceToken", () => {
  test("Creates service token correctly, with corrent userId," + " authentication list and creation date.", () => {
    const userId = 1;
    const authenticatedTo = [kjyrIdentifier, calendarIdentifier];
    const createdAt = new Date();

    const serviceToken = new ServiceToken(userId, authenticatedTo, createdAt);
    const token = serviceToken.toString();

    expect(token).toBeDefined();
    expect(token).not.to.equal('');

  });
  test("Should throw an exception when a malformed JWT is given", () => {
    expect(stringToServiceToken).to.throw(ServiceError)
  });
});

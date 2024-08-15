import { describe, test, expect } from "vitest";
import { stringToBoolean } from "../../src/utils/UserHelpers";

process.env.NODE_ENV = "test";

describe("stringToBoolean()", () => {
  test("'0' returns false", () => {
    const returnValue = stringToBoolean("0");
    expect(returnValue).to.equal(false);
  });
  test("'1' returns true", () => {
    const returnValue = stringToBoolean("1");
    expect(returnValue).to.equal(true);
  });
  test("'false' returns false", () => {
    const returnValue = stringToBoolean("false");
    expect(returnValue).to.equal(false);
  });
  test("'true' returns true", () => {
    const returnValue = stringToBoolean("true");
    expect(returnValue).to.equal(true);
  });
  test("anything else returns false", () => {
    const returnValue = stringToBoolean("shouldReturnFalse");
    expect(returnValue).to.equal(false);
  });
});

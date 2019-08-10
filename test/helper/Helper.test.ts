process.env.NODE_ENV = "test";

import "mocha";
import { stringToBoolean } from "../../src/utils/UserHelpers";

describe("stringToBoolean()", () => {
  it("'0' returns false", done => {
    const returnValue = stringToBoolean("0");
    returnValue.should.equal(false);
    done();
  });
  it("'1' returns true", done => {
    const returnValue = stringToBoolean("1");
    returnValue.should.equal(true);
    done();
  });
  it("'false' returns false", done => {
    const returnValue = stringToBoolean("false");
    returnValue.should.equal(false);
    done();
  });
  it("'true' returns true", done => {
    const returnValue = stringToBoolean("true");
    returnValue.should.equal(true);
    done();
  });
  it("anything else returns false", done => {
    const returnValue = stringToBoolean("shouldReturnFalse");
    returnValue.should.equal(false);
    done();
  });
});

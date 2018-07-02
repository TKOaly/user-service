process.env.NODE_ENV = "test";

import "mocha";
import { stringToBoolean } from "../../src/utils/Helpers";

describe("stringToBoolean()", () => {
  it("'0' returns false", (done: Mocha.Done) => {
    const returnValue: boolean = stringToBoolean("0");
    returnValue.should.equal(false);
    done();
  });
  it("'1' returns true", (done: Mocha.Done) => {
    const returnValue: boolean = stringToBoolean("1");
    returnValue.should.equal(true);
    done();
  });
  it("'false' returns false", (done: Mocha.Done) => {
    const returnValue: boolean = stringToBoolean("false");
    returnValue.should.equal(false);
    done();
  });
  it("'true' returns true", (done: Mocha.Done) => {
    const returnValue: boolean = stringToBoolean("true");
    returnValue.should.equal(true);
    done();
  });
  it("anything else returns false", (done: Mocha.Done) => {
    const returnValue: boolean = stringToBoolean("shouldReturnFalse");
    returnValue.should.equal(false);
    done();
  });
});

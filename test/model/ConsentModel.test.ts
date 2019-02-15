process.env.NODE_ENV = "test";

import chai = require("chai");
import "mocha";
import PrivacyPolicyConsent from "../../src/enum/PrivacyPolicyConsent";
import Consent from "../../src/models/Consent";
const should: Chai.Should = chai.should();

let consent: Consent;

describe("Consent model", () => {
  beforeEach((done: Mocha.Done) => {
    consent = {
      id: 11,
      consent: PrivacyPolicyConsent.Accepted,
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      service_id: 2,
      user_id: 5,
    };
    done();
  });

  it("Sets data correctly", (done: Mocha.Done) => {
    consent.id.should.equal(11);
    consent.consent.should.equal(PrivacyPolicyConsent.Accepted);
    consent.service_id.should.equal(2);
    consent.user_id.should.equal(5);
    consent.created.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    consent.modified.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    done();
  });

  it("Sets partial data correctly", (done: Mocha.Done) => {
    const consent2: Consent = new Consent({
      id: 55,
      consent: PrivacyPolicyConsent.Unknown,
    });
    consent2.id.should.equal(55);
    consent2.consent.should.equal(PrivacyPolicyConsent.Unknown);
    should.not.exist(consent2.created);
    should.not.exist(consent2.user_id);
    should.not.exist(consent2.service_id);
    should.not.exist(consent2.modified);
    done();
  });
});

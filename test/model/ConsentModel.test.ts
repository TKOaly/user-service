process.env.NODE_ENV = "test";

import chai = require("chai");
import "mocha";
import PrivacyPolicyConsent from "../../src/enum/PrivacyPolicyConsent";
import Consent from "../../src/models/Consent";
const should = chai.should();

let consent: Consent;

describe("Consent model", () => {
  beforeEach(done => {
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

  it("Sets data correctly", done => {
    should.exist(consent.id);
    should.exist(consent.consent);
    should.exist(consent.created);
    should.exist(consent.modified);
    should.exist(consent.service_id);
    should.exist(consent.user_id);
    consent.id.should.equal(11);
    consent.consent.should.equal(PrivacyPolicyConsent.Accepted);
    consent.service_id.should.equal(2);
    consent.user_id.should.equal(5);
    consent.created.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    consent.modified.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    done();
  });
});

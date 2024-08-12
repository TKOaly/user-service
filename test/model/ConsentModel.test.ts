import { describe, test, expect, beforeEach } from "vitest";
import PrivacyPolicyConsent from "../../src/enum/PrivacyPolicyConsent";
import Consent from "../../src/models/Consent";

process.env.NODE_ENV = "test";

let consent: Consent;

describe("Consent model", () => {
  beforeEach(() => {
    consent = {
      id: 11,
      consent: PrivacyPolicyConsent.Accepted,
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      service_id: 2,
      user_id: 5,
    };
  });

  test("Sets data correctly", () => {
    expect(consent).toMatchObject({
      id: 11,
      consent: PrivacyPolicyConsent.Accepted,
      service_id: 2,
      user_id: 5,
      created: expect.any(Date),
      modified: expect.any(Date),
    })

    expect(consent.created.toDateString()).to.equal(new Date(2017, 1, 1).toDateString());
    expect(consent.modified.toDateString()).to.equal(new Date(2017, 1, 1).toDateString());
  });
});

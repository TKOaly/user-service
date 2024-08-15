import { describe, test, beforeEach, expect } from "vitest";
import PrivacyPolicyDatabaseObject from "../../src/interfaces/PrivacyPolicyDatabaseObject";
import PrivacyPolicy from "../../src/models/PrivacyPolicy";

process.env.NODE_ENV = "test";

let policy: PrivacyPolicyDatabaseObject;
let policyModel: PrivacyPolicy;

describe("Privacy policy model", () => {
  beforeEach(() => {
    policy = {
      id: 552,
      created: new Date(2015, 1, 1),
      modified: new Date(2015, 1, 3),
      service_id: 22,
      text: "Hello World",
    };
    policyModel = new PrivacyPolicy(policy);
  });

  test("Sets data correctly (PrivacyPolicyDatabaseObject)", () => {
    expect(policyModel.id).toBeDefined();
    expect(policyModel.id).to.equal(552);
    expect(policyModel.created).toBeDefined();
    expect(policyModel.created.toDateString()).to.equal(new Date(2015, 1, 1).toDateString());
    expect(policyModel.modified).toBeDefined();
    expect(policyModel.modified.toDateString()).to.equal(new Date(2015, 1, 3).toDateString());
    expect(policyModel.service_id).toBeDefined();
    expect(policyModel.service_id).to.equal(22);
    expect(policyModel.text).toBeDefined();
    expect(policyModel.text).to.equal("Hello World");
  });

  test("Sets partial data correctly (PrivacyPolicyDatabaseObject)", () => {
    const policy2: Pick<PrivacyPolicy, "id" | "text"> = {
      id: 225,
      text: "Hello World 2",
    };

    expect(policy2.id).toBeDefined();
    expect(policy2.id).to.equal(225);
    expect(policy2.text).toBeDefined();
    expect(policy2.text).to.equal("Hello World 2");

    expect(policy2.created).not.toBeDefined();
    expect(policy2.modified).not.toBeDefined();
    expect(policy2.service_id).not.toBeDefined();
  });

  test("Sets data correctly (PrivacyPolicy)", () => {
    expect(policy.id).toBeDefined();
    expect(policy.id).to.equal(552);
    expect(policy.created).toBeDefined();
    expect(policy.created.toDateString()).to.equal(new Date(2015, 1, 1).toDateString());
    expect(policy.modified).toBeDefined();
    expect(policy.modified.toDateString()).to.equal(new Date(2015, 1, 3).toDateString());
    expect(policy.service_id).toBeDefined();
    expect(policy.service_id).to.equal(22);
    expect(policy.text).toBeDefined();
    expect(policy.text).to.equal("Hello World");
  });
});

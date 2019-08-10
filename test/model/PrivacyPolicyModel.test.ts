process.env.NODE_ENV = "test";

import chai = require("chai");
import "mocha";
import PrivacyPolicyDatabaseObject from "../../src/interfaces/PrivacyPolicyDatabaseObject";
import PrivacyPolicy from "../../src/models/PrivacyPolicy";
const should: Chai.Should = chai.should();

let policy: PrivacyPolicyDatabaseObject;
let policyModel: PrivacyPolicy;

describe("Privacy policy model", () => {
  beforeEach(done => {
    policy = {
      id: 552,
      created: new Date(2015, 1, 1),
      modified: new Date(2015, 1, 3),
      service_id: 22,
      text: "Hello World",
    };
    policyModel = new PrivacyPolicy(policy);
    done();
  });

  it("Sets data correctly (PrivacyPolicyDatabaseObject)", done => {
    should.exist(policyModel.id);
    policyModel.id.should.equal(552);
    should.exist(policyModel.created);
    policyModel.created.toDateString().should.equal(new Date(2015, 1, 1).toDateString());
    should.exist(policyModel.modified);
    policyModel.modified.toDateString().should.equal(new Date(2015, 1, 3).toDateString());
    should.exist(policyModel.service_id);
    policyModel.service_id.should.equal(22);
    should.exist(policyModel.text);
    policyModel.text.should.equal("Hello World");
    done();
  });

  it("Sets partial data correctly (PrivacyPolicyDatabaseObject)", done => {
    const policy2: Pick<PrivacyPolicy, "id" | "text"> = {
      id: 225,
      text: "Hello World 2",
    };

    should.exist(policy2.id);
    policy2.id.should.equal(225);
    should.exist(policy2.text);
    policy2.text.should.equal("Hello World 2");

    // @ts-ignore
    should.not.exist(policy2.created);
    // @ts-ignore
    should.not.exist(policy2.modified);
    // @ts-ignore
    should.not.exist(policy2.service_id);
    done();
  });

  it("Sets data correctly (PrivacyPolicy)", done => {
    should.exist(policy.id);
    policy.id.should.equal(552);
    should.exist(policy.created);
    policy.created.toDateString().should.equal(new Date(2015, 1, 1).toDateString());
    should.exist(policy.modified);
    policy.modified.toDateString().should.equal(new Date(2015, 1, 3).toDateString());
    should.exist(policy.service_id);
    policy.service_id.should.equal(22);
    should.exist(policy.text);
    policy.text.should.equal("Hello World");
    done();
  });
});

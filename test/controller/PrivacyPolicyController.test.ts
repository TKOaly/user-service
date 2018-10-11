process.env.NODE_ENV = "test";

import chai = require("chai");
import chaiHttp = require("chai-http");
import Knex from "knex";
import "mocha";
import { IKnexFile } from "../../knexfile";
// Knexfile
import * as knexfile from "../../knexfile";
import app from "../../src/App";
import { kjyrIdentifier } from "../TestUtils";
// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);

const should: Chai.Should = chai.should();

chai.use(chaiHttp);

const policyUrl: string = "/api/policy";

describe("PrivacyPolicyController", () => {
  // Roll back
  beforeEach("Knex migrate & seed", (done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach("Knex migrate rollback", (done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  describe("Privacy policy route", () => {
    it("GET /api/policy/KJYR_SERVICE_IDENTIFIER : Returns an existing privacy policy for KJYR", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(policyUrl + "/" + kjyrIdentifier)
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(200);
          should.exist(res.body.payload);
          should.exist(res.body.payload.text);
          should.exist(res.body.payload.service_id);
          should.exist(res.body.payload.modified);
          should.exist(res.body.payload.created);
          should.exist(res.body.ok);

          res.body.ok.should.equal(true);
          res.body.payload.id.should.equal(2);
          res.body.payload.service_id.should.equal(2);
          res.body.payload.text.should.equal("KJYR privacy policy");
          done();
        });
    });

    it("GET /api/policy/something : Returns an error if the privacy policy is not found", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(policyUrl + "/something")
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(404);
          should.not.exist(res.body.payload);
          should.exist(res.body.ok);
          should.exist(res.body.message);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Privacy policy not found");
          done();
        });
    });
  });
});

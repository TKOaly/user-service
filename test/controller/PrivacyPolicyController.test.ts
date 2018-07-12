process.env.NODE_ENV = "test";

import chaiHttp = require("chai-http");
import * as Knex from "knex";
import "mocha";
import app from "../../src/App";

// Knexfile
const knexfile: IKnexFile = require("../../knexfile");
// Knex instance
const knex: Knex = Knex(knexfile.test);

import chai = require("chai");
import { IKnexFile } from "../../knexfile";
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
    it("GET /api/policy/test : Returns an existing privacy policy", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(policyUrl + "/test")
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(200);
          should.exist(res.body.payload);
          should.exist(res.body.payload.text);
          should.exist(res.body.payload.name);
          should.exist(res.body.payload.modified);
          should.exist(res.body.payload.created);
          should.exist(res.body.ok);

          res.body.ok.should.equal(true);
          res.body.payload.text.should.equal("Hello World");
          res.body.payload.name.should.equal("test");
          res.body.payload.id.should.equal(1);
          done();
        });
    });

    it("GET /api/policy/somefile : Returns an error if the privacy policy is not found", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(policyUrl + "/somefile")
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

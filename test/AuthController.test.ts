process.env.NODE_ENV = "test";

import * as Chai from "chai";
import "mocha";
import * as Knex from "knex";
import app from "./../src/App";

// Knexfile
const knexfile = require("./../knexfile");
// Knex instance
const knex = Knex(knexfile[process.env.NODE_ENV || "staging"]);

const chai: Chai.ChaiStatic = require("chai");
const should = chai.should();
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const authUrl = "/api/auth";
const correctCreds = {
  username: "test_user",
  password: "test_user",
  serviceIdentifier: "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7"
};
const incorrectCreds = {
  username: "test_user",
  password: "testuser",
  serviceIdentifier: "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7"
};

const serviceName: string = "kjyr";

describe("AuthController", () => {
  // Roll back
  beforeEach(done => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach(done => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  it("Authenticates with correct credentials", done => {
    chai
      .request(app)
      .post(authUrl + "/requestPermissions")
      .send(correctCreds)
      .end((err, res) => {
        console.log(res.body);
        should.not.exist(err);
        res.status.should.equal(200);
        should.exist(res.body.payload);
        should.exist(res.body.payload.token);
        should.exist(res.body.ok);
        res.body.ok.should.equal(true);
        done();
      });
  });

  it("Does not authenticate with incorrect credentials", done => {
    chai
      .request(app)
      .post(authUrl + "/requestPermissions")
      .send(incorrectCreds)
      .end((err, res) => {
        should.exist(res.body.ok);
        should.exist(res.body.message);
        should.not.exist(res.body.token);
        res.status.should.equal(400);
        res.body.ok.should.equal(false);
        res.body.payload.should.equal(null);
        res.body.message.should.equal("Passwords do not match");
        done();
      });
  });
});

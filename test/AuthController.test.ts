process.env.NODE_ENV = "test";

import "mocha";
import * as Knex from "knex";
import app from "./../src/App";

// Knexfile
const knexfile = require("./../knexfile");
// Knex instance
const knex = Knex(knexfile["test"]);

const chai: Chai.ChaiStatic = require("chai");
const should = chai.should();
const chaiHttp = require("chai-http");
chai.use(chaiHttp);

const authUrl = "/api/auth";
const kjyrIdentifier: string = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
const calendarIdentifier: string = "65a0058d-f9da-4e76-a00a-6013300cab5f";
const correctCreds = {
  username: "test_user",
  password: "test_user",
  serviceIdentifier: kjyrIdentifier
};
const incorrectCreds = {
  username: "test_user",
  password: "testuser",
  serviceIdentifier: kjyrIdentifier
};

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
      .post(authUrl + "/authenticate")
      .send(correctCreds)
      .end((err, res) => {
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
      .post(authUrl + "/authenticate")
      .send(incorrectCreds)
      .end((err, res) => {
        should.exist(res.body.ok);
        should.exist(res.body.message);
        should.not.exist(res.body.payload);
        res.status.should.equal(401);
        res.body.ok.should.equal(false);
        res.body.message.should.equal("Invalid username or password");
        done();
      });
  });

  it("Checks that the correct service has been authenticated to", done => {
    // The default credentials authenticate to KJYR
    chai
      .request(app)
      .post(authUrl + "/authenticate")
      .send(correctCreds)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(200);
        should.exist(res.body.payload);
        should.exist(res.body.payload.token);
        should.exist(res.body.ok);
        res.body.ok.should.equal(true);

        // Token to be passed forwards
        const token: string = res.body.payload.token;

        // Next, check that the user is authenticated to KJYR (as an example)
        chai
          .request(app)
          .get(authUrl + "/check")
          .set("Authorization", "Bearer " + token)
          .set("service", kjyrIdentifier)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            should.exist(res.body.ok);
            should.exist(res.body.message);
            should.not.exist(res.body.payload);
            res.body.ok.should.equal(true);
            res.body.message.should.equal("Success");
            done();
          });
      });
  });

  it("Check that the user has not been authenticated to an incorrect service", done => {
    // The default credentials authenticate to KJYR
    chai
      .request(app)
      .post(authUrl + "/authenticate")
      .send(correctCreds)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(200);
        should.exist(res.body.payload);
        should.exist(res.body.payload.token);
        should.exist(res.body.ok);
        res.body.ok.should.equal(true);

        // Token to be passed forwards
        const token: string = res.body.payload.token;

        // Next, check that the user is not authenticated to calendar (as an example)
        chai
          .request(app)
          .get(authUrl + "/check")
          .set("Authorization", "Bearer " + token)
          .set("service", calendarIdentifier)
          .end((err, res) => {
            res.status.should.equal(403);
            should.exist(res.body.ok);
            should.exist(res.body.message);
            should.not.exist(res.body.payload);
            res.body.ok.should.equal(false);
            res.body.message.should.equal("Not authorized to service");

            done();
          });
      });
  });

  it("Can authenticate to multiple services", done => {
    // First, authenticate to KJYR
    chai
      .request(app)
      .post(authUrl + "/authenticate")
      .send(correctCreds)
      .end((err, res) => {
        should.not.exist(err);
        res.status.should.equal(200);
        should.exist(res.body.payload);
        should.exist(res.body.payload.token);
        should.exist(res.body.ok);
        res.body.ok.should.equal(true);

        // Token
        const token: string = res.body.payload.token;

        // Set calendar token to request
        const secondCreds = correctCreds;
        secondCreds.serviceIdentifier = calendarIdentifier;

        // Secondly, authenticate to calendar
        chai
          .request(app)
          .post(authUrl + "/authenticate")
          .set("Authorization", "Bearer " + token)
          .send(secondCreds)
          .end((err, res) => {
            should.not.exist(err);
            res.status.should.equal(200);
            should.exist(res.body.payload);
            should.exist(res.body.payload.token);
            should.exist(res.body.ok);
            res.body.ok.should.equal(true);

            const token2: string = res.body.payload.token;

            // Next, check auth for KJYR
            chai
              .request(app)
              .get(authUrl + "/check")
              .set("Authorization", "Bearer " + token2)
              .set("service", kjyrIdentifier)
              .end((err, res) => {
                should.not.exist(err);
                res.status.should.equal(200);
                should.exist(res.body.ok);
                should.exist(res.body.message);
                should.not.exist(res.body.payload);
                res.body.ok.should.equal(true);
                res.body.message.should.equal("Success");
                // Check calendar permission
                chai
                  .request(app)
                  .get(authUrl + "/check")
                  .set("Authorization", "Bearer " + token2)
                  .set("service", calendarIdentifier)
                  .end((err, res) => {
                    should.not.exist(err);
                    res.status.should.equal(200);
                    should.exist(res.body.ok);
                    should.exist(res.body.message);
                    should.not.exist(res.body.payload);
                    res.body.ok.should.equal(true);
                    res.body.message.should.equal("Success");
                    done();
                  });
              });
          });
      });
  });
});

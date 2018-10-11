process.env.NODE_ENV = "test";

import chai = require("chai");
import chaiHttp = require("chai-http");
import Knex from "knex";
import "mocha";
import { IKnexFile } from "../../knexfile";
// Knexfile
import * as knexfile from "../../knexfile";
import app from "../../src/App";

// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);
const should: Chai.Should = chai.should();

chai.use(chaiHttp);

const authUrl: string = "/api/auth";
const kjyrIdentifier: string = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
const calendarIdentifier: string = "65a0058d-f9da-4e76-a00a-6013300cab5f";
const correctCreds: { [value: string]: string } = {
  username: "test_user",
  password: "test_user",
  serviceIdentifier: kjyrIdentifier
};
const incorrectCreds: { [value: string]: string } = {
  username: "test_user",
  password: "testuser",
  serviceIdentifier: kjyrIdentifier
};

describe("AuthController", () => {
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

  describe("Authentication", () => {
    it("POST /api/auth/authenticate : Authenticates with correct credentials", (done: Mocha.Done) => {
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds)
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(200);
          should.exist(res.body.payload);
          should.exist(res.body.payload.token);
          should.exist(res.body.ok);
          res.body.ok.should.equal(true);
          done();
        });
    });

    it("POST /api/auth/authenticate : Does not authenticate with incorrect credentials", (done: Mocha.Done) => {
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send(incorrectCreds)
        .end((err: any, res: ChaiHttp.Response) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.status.should.equal(401);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Invalid username or password");
          done();
        });
    });

    it("POST /api/auth/authenticate : Does not authenticate with missing username", (done: Mocha.Done) => {
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send({
          password: "test",
          serviceIdentifier: kjyrIdentifier
        })
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(400);
          should.not.exist(res.body.payload);
          should.exist(res.body.ok);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Invalid request params");
          done();
        });
    });

    it("POST /api/auth/authenticate : Does not authenticate with missing password", (done: Mocha.Done) => {
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send({
          username: "test",
          serviceIdentifier: kjyrIdentifier
        })
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(400);
          should.not.exist(res.body.payload);
          should.exist(res.body.ok);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Invalid request params");
          done();
        });
    });

    it("POST /api/auth/authenticate : Does not authenticate with missing service identifier", (done: Mocha.Done) => {
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send({
          username: "test",
          password: "test"
        })
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(400);
          should.not.exist(res.body.payload);
          should.exist(res.body.ok);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Invalid request params");
          done();
        });
    });

    it(
      "POST /api/auth/authenticate : Returns an error when trying to" +
      " authenticate with a nonexistent service",
      (done: Mocha.Done) => {
        chai
          .request(app)
          .post(authUrl + "/authenticate")
          .send({
            username: "test",
            password: "test",
            serviceIdentifier: "invalidServiceIdentifier"
          })
          .end((err: any, res: ChaiHttp.Response) => {
            should.not.exist(err);
            res.status.should.equal(404);
            should.not.exist(res.body.payload);
            should.exist(res.body.ok);
            res.body.ok.should.equal(false);
            res.body.message.should.equal("Service not found");
            done();
          });
      }
    );
  });

  describe("Service check", () => {
    it(
      "POST /api/auth/authenticate : " +
      "Checks that the correct service has been authenticated to",
      (done: Mocha.Done) => {
        // The default credentials authenticate to KJYR
        chai
          .request(app)
          .post(authUrl + "/authenticate")
          .send(correctCreds)
          .end((err: any, res: ChaiHttp.Response) => {
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
              .end((err: any, res: ChaiHttp.Response) => {
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
      }
    );

    it(
      "POST /api/auth/authenticate : " +
      "Check that the user has not been authenticated to an incorrect service",
      (done: Mocha.Done) => {
        // The default credentials authenticate to KJYR
        chai
          .request(app)
          .post(authUrl + "/authenticate")
          .send(correctCreds)
          .end((err: any, res: ChaiHttp.Response) => {
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
              .end((err: any, res: ChaiHttp.Response) => {
                res.status.should.equal(403);
                should.exist(res.body.ok);
                should.exist(res.body.message);
                should.not.exist(res.body.payload);
                res.body.ok.should.equal(false);
                res.body.message.should.equal("Not authorized to service");

                done();
              });
          });
      }
    );

    it("GET /api/auth/check : Can authenticate to multiple services", (done: Mocha.Done) => {
      // First, authenticate to KJYR
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds)
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(200);
          should.exist(res.body.payload);
          should.exist(res.body.payload.token);
          should.exist(res.body.ok);
          res.body.ok.should.equal(true);

          // Token
          const token: string = res.body.payload.token;

          // Set calendar token to request
          const secondCreds: any = correctCreds;
          secondCreds.serviceIdentifier = calendarIdentifier;

          // Secondly, authenticate to calendar
          chai
            .request(app)
            .post(authUrl + "/authenticate")
            .set("Authorization", "Bearer " + token)
            .send(secondCreds)
            .end((err: any, res: ChaiHttp.Response) => {
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
                .end((err: any, res: ChaiHttp.Response) => {
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
                    .end((err: any, res: ChaiHttp.Response) => {
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

    it("GET /api/auth/check : Returns error if service is not defined", (done: Mocha.Done) => {
      // First, authenticate to KJYR
      chai
        .request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds)
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          res.status.should.equal(200);
          should.exist(res.body.payload);
          should.exist(res.body.payload.token);
          should.exist(res.body.ok);
          res.body.ok.should.equal(true);

          // Token
          const token: string = res.body.payload.token;

          // Check auth for kjyr
          chai
            .request(app)
            .get(authUrl + "/check")
            .set("Authorization", "Bearer " + token)
            .end((err: any, res: ChaiHttp.Response) => {
              should.not.exist(err);
              res.status.should.equal(400);
              should.exist(res.body.ok);
              should.exist(res.body.message);
              should.not.exist(res.body.payload);
              res.body.ok.should.equal(false);
              res.body.message.should.equal("No service defined");
              done();
            });
        });
    });
  });
});

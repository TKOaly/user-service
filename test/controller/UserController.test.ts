process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
import app from "../../src/App";

import userFile = require("../../seeds/seedData/users");
const users: IUserDatabaseObject[] = userFile as IUserDatabaseObject[];

import IUserDatabaseObject from "../../src/interfaces/IUserDatabaseObject";
import User from "../../src/models/User";
import AuthenticationService from "../../src/services/AuthenticationService";
import { generateToken, kjyrIdentifier } from "../TestUtils";

// Knexfile
const knexfile: any = require("../../knexfile");
// Knex instance
const knex: any = Knex(knexfile.test);

import chai = require("chai");
import ServiceDao from "../../src/dao/ServiceDao";
import Service, { IServiceDatabaseObject } from "../../src/models/Service";
const should: Chai.Should = chai.should();
const chaiHttp: any = require("chai-http");
chai.use(chaiHttp);

const url: string = "/api/users";

// Service dao
const authService: AuthenticationService = new AuthenticationService(
  new ServiceDao(knex)
);

describe("UserController", () => {
  // Roll back
  beforeEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  describe("Returns all users", () => {
    // Roll back
    beforeEach((done: Mocha.Done) => {
      knex.migrate.rollback().then(() => {
        knex.migrate.latest().then(() => {
          knex.seed.run().then(() => {
            done();
          });
        });
      });
    });

    // After each
    afterEach((done: Mocha.Done) => {
      knex.migrate.rollback().then(() => {
        done();
      });
    });

    it("GET /api/users : As an authenticated user, returns all users", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url)
        .set("Authorization", "Bearer " + generateToken(2))
        .end((err: any, res: ChaiHttp.Response) => {
          should.not.exist(err);
          should.exist(res.body.ok);
          res.body.ok.should.equal(true);
          should.exist(res.body.payload);
          should.exist(res.body.message);
          res.body.message.should.equal("Success");
          res.status.should.equal(200);
          res.body.payload.length.should.equal(users.length);
          res.body.ok.should.equal(true);

          res.body.payload.forEach((payloadObject: User, i: number) => {
            const user_2: User = new User(
              users.find((usr: User) => usr.id === payloadObject.id)
            );

            should.exist(payloadObject.id);
            payloadObject.id.should.equal(user_2.id);

            should.exist(payloadObject.createdAt);

            should.exist(payloadObject.isDeleted);
            payloadObject.isDeleted.should.equal(user_2.isDeleted);

            should.exist(payloadObject.email);
            payloadObject.email.should.equal(user_2.email);

            should.exist(payloadObject.isHYYMember);
            payloadObject.isHYYMember.should.equal(user_2.isHYYMember);

            should.exist(payloadObject.membership);
            payloadObject.membership.should.equal(user_2.membership);

            should.exist(payloadObject.modifiedAt);

            should.exist(payloadObject.name);
            payloadObject.name.should.equal(user_2.name);

            should.exist(payloadObject.phone);
            payloadObject.phone.should.equal(user_2.phone);

            should.exist(payloadObject.residence);
            payloadObject.residence.should.equal(user_2.residence);

            should.exist(payloadObject.role);
            payloadObject.role.should.equal(user_2.role);

            should.exist(payloadObject.screenName);
            payloadObject.screenName.should.equal(user_2.screenName);

            should.exist(payloadObject.isTKTL);
            payloadObject.isTKTL.should.equal(user_2.isTKTL);

            should.exist(payloadObject.username);
            payloadObject.username.should.equal(user_2.username);
          });
          done();
        });
    });

    it("GET /api/users : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url)
        .end((err: any, res: ChaiHttp.Response) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });
  });

  describe("Returns a single user", () => {
    it("GET /api/users/{id} : As an authenticated user, returns a single user", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(2))
        .end((err: any, res: ChaiHttp.Response) => {
          res.status.should.equal(200);
          should.exist(res.body.ok);
          res.body.ok.should.equal(true);
          should.exist(res.body.payload);
          should.exist(res.body.message);
          res.body.message.should.equal("Success");

          const user_2: User = new User(
            users.find((user: IUserDatabaseObject) => user.id === 1)
          );

          should.exist(user_2);

          const payloadObject: User = res.body.payload;

          should.exist(payloadObject.id);
          payloadObject.id.should.equal(user_2.id);

          should.exist(payloadObject.createdAt);

          should.exist(payloadObject.isDeleted);
          payloadObject.isDeleted.should.equal(user_2.isDeleted);

          should.exist(payloadObject.email);
          payloadObject.email.should.equal(user_2.email);

          should.exist(payloadObject.isHYYMember);
          payloadObject.isHYYMember.should.equal(user_2.isHYYMember);

          should.exist(payloadObject.membership);
          payloadObject.membership.should.equal(user_2.membership);

          should.exist(payloadObject.modifiedAt);

          should.exist(payloadObject.name);
          payloadObject.name.should.equal(user_2.name);

          should.exist(payloadObject.phone);
          payloadObject.phone.should.equal(user_2.phone);

          should.exist(payloadObject.residence);
          payloadObject.residence.should.equal(user_2.residence);

          should.exist(payloadObject.role);
          payloadObject.role.should.equal(user_2.role);

          should.exist(payloadObject.screenName);
          payloadObject.screenName.should.equal(user_2.screenName);

          should.exist(payloadObject.isTKTL);
          payloadObject.isTKTL.should.equal(user_2.isTKTL);

          should.exist(payloadObject.username);
          payloadObject.username.should.equal(user_2.username);

          done();
        });
    });

    it("GET /api/users/{id} : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url + "/1")
        .end((err: any, res: ChaiHttp.Response) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });
  });

  describe("Returns my information", () => {
    it("GET /api/users/me : Returns an error if no service is defined", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url + "/me")
        .set("Authorization", "Bearer " + generateToken(1, [kjyrIdentifier]))
        .end((err: any, res: ChaiHttp.Response) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("No service defined");
          res.status.should.equal(400);
          done();
        });
    });

    it(
      "GET /api/users/me: Trying to get information from" +
        " a service the user is not authenticated to",
      (done: Mocha.Done) => {
        chai
          .request(app)
          .get(url + "/me")
          .set("Authorization", "Bearer " + generateToken(1, []))
          .set("Service", kjyrIdentifier)
          .end((err: any, res: ChaiHttp.Response) => {
            should.exist(res.body.ok);
            should.exist(res.body.message);
            should.not.exist(res.body.payload);
            res.body.ok.should.equal(false);
            res.body.message.should.equal("User not authorized to service");
            res.status.should.equal(403);
            done();
          });
      }
    );

    it(
      "GET /api/users/me : Removes unwanted information" +
        " and returns my information from every service",
      (done: Mocha.Done) => {
        authService
          .getServices()
          .then((dbServices: Service[]) => {
            const services: IServiceDatabaseObject[] = dbServices.map(
              (dbService: Service) => dbService.getDatabaseObject()
            );
            // Loop through services
            for (const service of services) {
              const serviceIdentifier: string = service.service_identifier;
              const permissionNumber: number = service.data_permissions;

              chai
                .request(app)
                .get(url + "/me")
                .set(
                  "Authorization",
                  "Bearer " + generateToken(1, [serviceIdentifier])
                )
                .set("Service", serviceIdentifier)
                .end((err: any, res: ChaiHttp.Response) => {
                  res.status.should.equal(200);
                  should.exist(res.body.ok);
                  res.body.ok.should.equal(true);
                  should.exist(res.body.payload);
                  should.exist(res.body.message);
                  res.body.message.should.equal("Success");

                  const user_2: User = new User(
                    users.find((user: IUserDatabaseObject) => user.id === 1)
                  );

                  should.exist(user_2);

                  const payloadObject: User = res.body.payload;

                  const user: User = new User(
                    user_2.getDatabaseObject()
                  ).removeSensitiveInformation();

                  delete user.createdAt;
                  delete user.modifiedAt;

                  const allFields: string[] = Object.keys(user);

                  const required: string[] = Object.keys(
                    user_2
                      .removeSensitiveInformation()
                      .removeNonRequestedData(permissionNumber)
                  );
                  for (const field of allFields) {
                    if (
                      required.find(
                        (requiredField: string) => requiredField === field
                      )
                    ) {
                      // Should expect and equal
                      should.exist(payloadObject[field]);
                      payloadObject[field].should.equal(user_2[field]);
                    } else {
                      // Should not exist
                      should.not.exist(payloadObject[field]);
                    }
                  }
                });
            }
            done();
          })
          .catch(err => console.error(err));
      }
    );
  });
});

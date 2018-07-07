process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
import UserDao from "../../src/dao/UserDao";
import UserService from "../../src/services/UserService";
import ServiceError from "../../src/utils/ServiceError";
import UserValidator from "../../src/validators/UserValidator";

// Knexfile
const knexfile: any = require("../../knexfile");
// Knex instance
const knex: any = Knex(knexfile.test);

let userValidator: UserValidator;

import chai = require("chai");
const should: Chai.Should = chai.should();

describe("UserValidator", () => {
  // Roll back
  beforeEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          userValidator = new UserValidator(new UserService(new UserDao(knex)));
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

  it("Throws a service error when missing required information #1", (done: Mocha.Done) => {
    userValidator.validateCreate({} as any).catch((err: ServiceError) => {
      should.exist(err.message);
      err.message.should.equal("Missing required information");
      should.exist(err.httpErrorCode);
      err.httpErrorCode.should.equal(400);
      done();
    });
  });

  it("Throws a service error when missing required information #2", (done: Mocha.Done) => {
    userValidator
      .validateCreate({ username: "test", email: "test@test.com" } as any)
      .catch((err: ServiceError) => {
        should.exist(err.message);
        err.message.should.equal("Missing required information");
        should.exist(err.httpErrorCode);
        err.httpErrorCode.should.equal(400);
        done();
      });
  });

  it("Throws a service error when username is already taken", (done: Mocha.Done) => {
    userValidator
      .validateCreate({
        username: "test_user",
        name: "testUser",
        screenName: "jee",
        email: "test@test.com",
        residence: "123",
        phone: "12345",
        password1: "testpassword",
        password2: "testpassword"
      } as any)
      .catch((err: ServiceError) => {
        should.exist(err.message);
        err.message.should.equal("Username already taken");
        should.exist(err.httpErrorCode);
        err.httpErrorCode.should.equal(400);
        done();
      });
  });

  it("Throws a service error if email address is malformed", (done: Mocha.Done) => {
    userValidator
      .validateCreate({
        username: "testuser",
        name: "testUser",
        screenName: "jee",
        email: "test.com",
        residence: "123",
        phone: "12345",
        password1: "testpassword",
        password2: "testpassword"
      } as any)
      .catch((err: ServiceError) => {
        should.exist(err.message);
        err.message.should.equal("Malformed email");
        should.exist(err.httpErrorCode);
        err.httpErrorCode.should.equal(400);
        done();
      });
  });

  it("Throws a service error if the email address is too long", (done: Mocha.Done) => {
    userValidator
      .validateCreate({
        username: "testuser",
        name: "testUser",
        screenName: "jee",
        email:
          "testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@test.com",
        residence: "123",
        phone: "12345",
        password1: "testpassword",
        password2: "testpassword"
      } as any)
      .catch((err: ServiceError) => {
        should.exist(err.message);
        err.message.should.equal("Malformed email");
        should.exist(err.httpErrorCode);
        err.httpErrorCode.should.equal(400);
        done();
      });
  });

  it("Throws a service error if the passwords do not match", (done: Mocha.Done) => {
    userValidator
      .validateCreate({
        username: "testuser",
        name: "testUser",
        screenName: "jee",
        email: "test@test.com",
        residence: "123",
        phone: "12345",
        password1: "testpassword",
        password2: "testpassword1"
      } as any)
      .catch((err: ServiceError) => {
        should.exist(err.message);
        err.message.should.equal("Passwords do not match");
        should.exist(err.httpErrorCode);
        err.httpErrorCode.should.equal(400);
        done();
      });
  });

  it("If no errors occur, return nothing", (done: Mocha.Done) => {
    userValidator
      .validateCreate({
        username: "testuser",
        name: "testUser",
        screenName: "jee",
        email: "test@test.com",
        residence: "123",
        phone: "12345",
        password1: "testpassword",
        password2: "testpassword"
      } as any)
      .then(function() {
        done();
      });
  });
});

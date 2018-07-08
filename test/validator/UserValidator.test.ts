process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
import UserDao from "../../src/dao/UserDao";
import UserService from "../../src/services/UserService";
import ServiceError from "../../src/utils/ServiceError";
import UserValidator, {
  IAdditionalUserData
} from "../../src/validators/UserValidator";

// Knexfile
const knexfile: any = require("../../knexfile");
// Knex instance
const knex: any = Knex(knexfile.test);

let userValidator: UserValidator;
const userDao: UserDao = new UserDao(knex);

import chai = require("chai");
import UserRoleString from "../../src/enum/UserRoleString";
import IUserDatabaseObject from "../../src/interfaces/IUserDatabaseObject";
import User from "../../src/models/User";
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

  describe("checkEmailValidity()", () => {
    it("A valid email address returns true", () => {
      const valid: boolean = userValidator.checkEmailValidity("test@email.com");
      valid.should.equal(true);
    });

    it("Too long email address returns false", () => {
      const valid: boolean = userValidator.checkEmailValidity(
        "testtesttesttesttesttesttesttesttesttesttesttesttestt" +
          "esttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@email.com"
      );
      valid.should.equal(false);
    });

    it("An invalid email address should return false", () => {
      const valid: boolean = userValidator.checkEmailValidity("test.com");
      valid.should.equal(false);
    });
  });

  describe("validateCreate()", () => {
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

    it("Throws a service error when email is already taken", (done: Mocha.Done) => {
      userValidator
        .validateCreate({
          username: "testuser",
          name: "testuser",
          screenName: "jee",
          email: "test@user.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword"
        } as any)
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Email address already taken");
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
        })
        .catch(err => {
          console.log(err);
        });
    });
  });

  describe("validateUpdate()", () => {
    it("Throws a service error when a normal user tries to modify a forbidden value", (done: Mocha.Done) => {
      userDao
        .findOne(1)
        .then((user: IUserDatabaseObject) => {
          userValidator
            .validateUpdate(
              user.id,
              { username: "test_user_123" } as User & IAdditionalUserData,
              new User(user)
            )
            .catch((err: ServiceError) => {
              should.exist(err.message);
              err.message.should.equal("Forbidden modify action");
              should.exist(err.httpErrorCode);
              err.httpErrorCode.should.equal(403);
              done();
            });
        })
        .catch(err => {
          console.log(err);
        });
    });

    it(
      "Throws a service error when an elevated user" +
        " tries to set email address to an already used email address",
      (done: Mocha.Done) => {
        userDao
          .findOne(2)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                1,
                { email: "admin@user.com" } as User & IAdditionalUserData,
                new User(user)
              )
              .catch((err: ServiceError) => {
                should.exist(err.message);
                err.message.should.equal("Email address already taken");
                should.exist(err.httpErrorCode);
                err.httpErrorCode.should.equal(400);
                done();
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );

    it(
      "Throws a service error when an elevated user" +
        " tries to set a malformed used email address",
      (done: Mocha.Done) => {
        userDao
          .findOne(2)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                1,
                { email: "test123" } as User & IAdditionalUserData,
                new User(user)
              )
              .catch((err: ServiceError) => {
                should.exist(err.message);
                err.message.should.equal("Malformed email");
                should.exist(err.httpErrorCode);
                err.httpErrorCode.should.equal(400);
                done();
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );

    it(
      "Throws a service error when a user" +
        " tries to set a new password that doesn't match",
      (done: Mocha.Done) => {
        userDao
          .findOne(1)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                1,
                {
                  password1: "test_password",
                  password2: "test_password2"
                } as User & IAdditionalUserData,
                new User(user)
              )
              .catch((err: ServiceError) => {
                should.exist(err.message);
                err.message.should.equal("Passwords do not match");
                should.exist(err.httpErrorCode);
                err.httpErrorCode.should.equal(400);
                done();
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );

    it(
      "Throws a service error when a jasenvirkailija tries to" +
        " modify another user with a forbidden value",
      (done: Mocha.Done) => {
        // Seed user #3 is a jasenvirkailija and wants to update a user.
        userDao
          .findOne(3)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                2,
                { role: UserRoleString.Kayttaja } as User & IAdditionalUserData,
                new User(user)
              )
              .catch((err: ServiceError) => {
                should.exist(err.message);
                err.message.should.equal("Forbidden modify action");
                should.exist(err.httpErrorCode);
                err.httpErrorCode.should.equal(403);
                done();
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );

    it(
      "Succeeds when jasenvirkailija tries to" +
        " modify another user with a valid value",
      (done: Mocha.Done) => {
        userDao
          .findOne(3)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                2,
                { username: "tester" } as User & IAdditionalUserData,
                new User(user)
              )
              .then(res => {
                done();
              })
              .catch(err => {
                console.log(err);
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );

    it(
      "Throws a service error when a user" +
        " with an unknown set of permissions tries to modify another user",
      (done: Mocha.Done) => {
        // Seed user #4 is a tenttiarkistovirkailija
        userDao
          .findOne(4)
          .then((user: IUserDatabaseObject) => {
            userValidator
              .validateUpdate(
                1,
                { email: "test123" } as User & IAdditionalUserData,
                new User(user)
              )
              .catch((err: ServiceError) => {
                should.exist(err.message);
                err.message.should.equal("Forbidden modify action");
                should.exist(err.httpErrorCode);
                err.httpErrorCode.should.equal(403);
                done();
              });
          })
          .catch(err => {
            console.log(err);
          });
      }
    );
  });
});

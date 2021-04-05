import "mocha";
import UserDao from "../../src/dao/UserDao";
import ServiceError from "../../src/utils/ServiceError";
import UserValidator, {
  hasForeignKeys,
  userDataKeys,
  isValidPartialUser,
  isValidUser,
  checkEmailValidity,
} from "../../src/validators/UserValidator";
import { knexInstance } from "../../src/Db";
import UserRoleString from "../../src/enum/UserRoleString";
import User from "../../src/models/User";

process.env.NODE_ENV = "test";
import chai = require("chai");

// Knexfile
const knex = knexInstance;
const userDao = UserDao;
const should = chai.should();
let userValidator: UserValidator;

describe("UserValidator", () => {
  // Roll back
  beforeEach(done => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          userValidator = new UserValidator();
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

  describe("hasForeignKeys()", () => {
    it("Should return false if no foreign keys exist", () => {
      const res = hasForeignKeys(
        {
          phone: "0100100",
        },
        userDataKeys,
      );
      res.should.equal(false);
    });
    it("Should return true if foreign keys exist", () => {
      const res = hasForeignKeys(
        {
          phone: "0100100",
          hello: "Wrodl",
        },
        userDataKeys,
      );
      res.should.equal(true);
    });
  });

  describe("isValidPartialUser()", () => {
    it("Should return false if the object is not a valid partial user #1", () => {
      const res = isValidPartialUser({
        phone: "0100100",
        hello: "World",
      });
      res.should.equal(false);
    });
    it("Should return false if the object is not a valid partial user #2", () => {
      const res = isValidPartialUser({
        phone: 12345,
      });
      res.should.equal(false);
    });
    it("Should return true if the object is a valid partial user #1", () => {
      const res = isValidPartialUser({
        phone: "0100100",
      });
      res.should.equal(true);
    });
    it("Should return true if the object is a valid partial user #2", () => {
      const res = isValidPartialUser({
        phone: "0100100",
        email: "test@localhost.com",
        isHYYMember: true,
        isHyStaff: true,
        isTKTL: true,
        isHyStudent: true,
        name: "Aku Ankka",
        password1: "hunter1",
        password2: "hunter1",
        residence: "Helsinki",
        screenName: "Aku-setä",
        username: "akuankka",
      });
      res.should.equal(true);
    });
  });

  describe("isValidUser()", () => {
    it("Should return false if the object is not a valid user #1", () => {
      const res = isValidUser({
        phone: "0100100",
      });
      res.should.equal(false);
    });
    it("Should return false if the object is not a valid user #2", () => {
      const res = isValidUser({
        phone: 12345,
      });
      res.should.equal(false);
    });
    it("Should return false if the object is not a valid a user #3", () => {
      const res = isValidUser({
        phone: "0100100",
        email: "test@localhost.com",
        isHYYMember: true,
        isHyStaff: true,
        isTKTL: true,
        isHyStudent: true,
        name: "Aku Ankka",
        password1: "hunter1",
        password2: "hunter1",
        residence: "Helsinki",
        screenName: "Aku-setä",
        username: "akuankka",
        hello: "World",
      });
      res.should.equal(false);
    });
    it("Should return true if the object is a user #1", () => {
      const res = isValidUser({
        phone: "0100100",
        email: "test@localhost.com",
        isHYYMember: true,
        isHyStaff: true,
        isTKTL: true,
        isHyStudent: true,
        name: "Aku Ankka",
        password1: "hunter1",
        password2: "hunter1",
        residence: "Helsinki",
        screenName: "Aku-setä",
        username: "akuankka",
      });
      res.should.equal(true);
    });
  });

  describe("checkEmailValidity()", () => {
    it("A valid email address returns true", () => {
      const valid: boolean = checkEmailValidity("test@email.com");
      valid.should.equal(true);
    });

    it("Too long email address returns false", () => {
      const valid: boolean = checkEmailValidity(
        "testtesttesttesttesttesttesttesttesttesttesttesttestt" +
          "esttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@email.com",
      );
      valid.should.equal(false);
    });

    it("An invalid email address should return false", () => {
      const valid: boolean = checkEmailValidity("test.com");
      valid.should.equal(false);
    });
  });

  describe("validateCreate()", () => {
    it("Throws a service error when username is already taken", done => {
      userValidator
        .validateCreate({
          username: "test_user",
          name: "testUser",
          screenName: "jee",
          email: "test@test.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Username is already taken.");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
    });

    it("Throws a service error when email address is already taken", done => {
      userValidator
        .validateCreate({
          username: "testuser",
          name: "testuser",
          screenName: "jee",
          email: "test@user.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Email address is already taken.");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
    });

    it("Throws a service error if the email address is malformed", done => {
      userValidator
        .validateCreate({
          username: "testuser",
          name: "testUser",
          screenName: "jee",
          email: "test.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Malformed email address.");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
    });

    it("Throws a service error if the email address is too long", done => {
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
          password2: "testpassword",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Malformed email address.");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
    });

    it("Throws a service error if the passwords do not match", done => {
      userValidator
        .validateCreate({
          username: "testuser",
          name: "testUser",
          screenName: "jee",
          email: "test@test.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword1",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Passwords do not match.");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
    });

    it("If no errors occur, return nothing", done => {
      userValidator
        .validateCreate({
          username: "testuser",
          name: "testUser",
          screenName: "jee",
          email: "test@test.com",
          residence: "123",
          phone: "12345",
          password1: "testpassword",
          password2: "testpassword",
          isHyStaff: true,
          isHYYMember: true,
          isTKTL: false,
          isHyStudent: false,
        })
        .then(function () {
          done();
        })
        .catch(err => {
          console.log(err);
        });
    });
  });

  describe("validateUpdate()", () => {
    it("Throws a service error when a normal user tries to modify a forbidden value", done => {
      userDao.findOne(1).then(user => {
        if (user === undefined) {
          throw new Error("User not found");
        }
        userValidator
          .validateUpdate(user.id, { username: "test_user_123" }, new User(user))
          .catch((err: ServiceError) => {
            should.exist(err.message);
            err.message.should.equal("Forbidden modify action");
            should.exist(err.httpErrorCode);
            err.httpErrorCode.should.equal(403);
            done();
          });
      });
    });

    it(
      "Throws a service error when an elevated user" + " tries to set email address to an already used email address",
      done => {
        userDao.findOne(2).then(user => {
          if (user === undefined) {
            throw new Error("User not found");
          }
          userValidator.validateUpdate(1, { email: "admin@user.com" }, new User(user)).catch((err: ServiceError) => {
            should.exist(err.message);
            err.message.should.equal("Validation errors: Email address is already taken");
            should.exist(err.httpErrorCode);
            err.httpErrorCode.should.equal(400);
            done();
          });
        });
      },
    );

    it("Throws a service error when an elevated user" + " tries to set a malformed used email address", done => {
      userDao.findOne(2).then(user => {
        if (user === undefined) {
          throw new Error("User not found");
        }
        userValidator.validateUpdate(1, { email: "test123" }, new User(user)).catch((err: ServiceError) => {
          should.exist(err.message);
          err.message.should.equal("Validation errors: Email address is malformed");
          should.exist(err.httpErrorCode);
          err.httpErrorCode.should.equal(400);
          done();
        });
      });
    });

    it("Succeeds when an elevated user" + " tries to set his own used email address", done => {
      userDao.findOne(2).then(user => {
        if (user === undefined) {
          throw new Error("User not found");
        }
        userValidator.validateUpdate(2, { email: "admin@user.com" }, new User(user)).then(_res => done());
      });
    });

    it("Throws a service error when a user" + " tries to set a new password that doesn't match", done => {
      userDao.findOne(1).then(user => {
        if (user === undefined) {
          throw new Error("User not found");
        }
        userValidator
          .validateUpdate(1, { password1: "test_password", password2: "test_password2" }, new User(user))
          .catch((err: ServiceError) => {
            should.exist(err.message);
            err.message.should.equal("Validation errors: Passwords do not match");
            should.exist(err.httpErrorCode);
            err.httpErrorCode.should.equal(400);
            done();
          });
      });
    });

    it(
      "Throws a service error with two validation errors when a user" +
        " tries to set a new password that doesn't match and a malformed email",
      done => {
        userDao.findOne(1).then(user => {
          if (user === undefined) {
            throw new Error("User not found");
          }
          userValidator
            .validateUpdate(
              1,
              { password1: "test_password", password2: "test_password2", email: "HelloWorld" },
              new User(user),
            )
            .catch((err: ServiceError) => {
              should.exist(err.message);
              err.message.should.equal("Validation errors: Email address is malformed, Passwords do not match");
              should.exist(err.httpErrorCode);
              err.httpErrorCode.should.equal(400);
              done();
            });
        });
      },
    );

    it(
      "Throws a service error when a jasenvirkailija tries to" + " modify another user with a forbidden value",
      done => {
        // Seed user #3 is a jasenvirkailija and wants to update a user.
        userDao.findOne(3).then(user => {
          if (user === undefined) {
            throw new Error("User not found");
          }
          userValidator
            .validateUpdate(2, { role: UserRoleString.Kayttaja }, new User(user))
            .catch((err: ServiceError) => {
              should.exist(err.message);
              err.message.should.equal("Forbidden modify action");
              should.exist(err.httpErrorCode);
              err.httpErrorCode.should.equal(403);
              done();
            });
        });
      },
    );

    it("Succeeds when jasenvirkailija tries to" + " modify another user with a valid value", done => {
      userDao.findOne(3).then(user => {
        if (user === undefined) {
          throw new Error("User not found");
        }
        userValidator
          .validateUpdate(2, { username: "tester" }, new User(user))
          .then(_res => {
            done();
          })
          .catch(err => {
            console.log(err);
          });
      });
    });

    it(
      "Throws a service error when a user" + " with an unknown set of permissions tries to modify another user",
      done => {
        // Seed user #4 is a tenttiarkistovirkailija
        userDao.findOne(4).then(user => {
          if (user === undefined) {
            throw new Error("User not found");
          }
          userValidator.validateUpdate(1, { email: "test123" }, new User(user)).catch((err: ServiceError) => {
            should.exist(err.message);
            err.message.should.equal("Forbidden modify action");
            should.exist(err.httpErrorCode);
            err.httpErrorCode.should.equal(403);
            done();
          });
        });
      },
    );
  });
});

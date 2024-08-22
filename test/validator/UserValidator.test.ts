import { describe, test, beforeEach, afterEach, expect } from "vitest";
import UserDao from "../../src/dao/UserDao";
import ServiceError from "../../src/utils/ServiceError";
import UserValidator, {
  hasForeignKeys,
  userDataKeys,
  isValidPartialUser,
  isValidUser,
  checkEmailValidity,
} from "../../src/validators/UserValidator";
import { knexInstance as knex } from "../../src/Db";
import UserRoleString from "../../src/enum/UserRoleString";
import User from "../../src/models/User";

process.env.NODE_ENV = "test";

const userDao = UserDao;
let userValidator: UserValidator;

describe("UserValidator", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();

    userValidator = new UserValidator();
  });

  // After each
  afterEach(async () => {
    await knex.migrate.rollback();
  });

  describe("hasForeignKeys()", () => {
    test("Should return false if no foreign keys exist", () => {
      const res = hasForeignKeys(
        {
          phone: "0100100",
        },
        userDataKeys,
      );
      expect(res).to.equal(false);
    });
    test("Should return true if foreign keys exist", () => {
      const res = hasForeignKeys(
        {
          phone: "0100100",
          hello: "Wrodl",
        },
        userDataKeys,
      );
      expect(res).to.equal(true);
    });
  });

  describe("isValidPartialUser()", () => {
    test("Should return false if the object is not a valid partial user #1", () => {
      const res = isValidPartialUser({
        phone: "0100100",
        hello: "World",
      });
      expect(res).to.equal(false);
    });
    test("Should return false if the object is not a valid partial user #2", () => {
      const res = isValidPartialUser({
        phone: 12345,
      });
      expect(res).to.equal(false);
    });
    test("Should return true if the object is a valid partial user #1", () => {
      const res = isValidPartialUser({
        phone: "0100100",
      });
      expect(res).to.equal(true);
    });
    test("Should return true if the object is a valid partial user #2", () => {
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
      expect(res).to.equal(true);
    });
  });

  describe("isValidUser()", () => {
    test("Should return false if the object is not a valid user #1", () => {
      const res = isValidUser({
        phone: "0100100",
      });
      expect(res).to.equal(false);
    });
    test("Should return false if the object is not a valid user #2", () => {
      const res = isValidUser({
        phone: 12345,
      });
      expect(res).to.equal(false);
    });
    test("Should return false if the object is not a valid a user #3", () => {
      const res = isValidUser({
        phone: "0100100",
        email: "test@localhost.com",
        isHYYMember: true,
        isHyStaff: true,
        isTKTL: true,
        isHyStudent: true,
        isTKTDTStudent: false,
        name: "Aku Ankka",
        password1: "hunter1",
        password2: "hunter1",
        residence: "Helsinki",
        screenName: "Aku-setä",
        username: "akuankka",
        hello: "World",
      });
      expect(res).to.equal(false);
    });
    test("Should return true if the object is a user #1", () => {
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
        isTKTDTStudent: false,
      });
      expect(res).to.equal(true);
    });
  });

  describe("checkEmailValidity()", () => {
    test("A valid email address returns true", () => {
      const valid: boolean = checkEmailValidity("test@email.com");
      expect(valid).to.equal(true);
    });

    test("Too long email address returns false", () => {
      const valid: boolean = checkEmailValidity(
        "testtesttesttesttesttesttesttesttesttesttesttesttestt" +
          "esttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest@email.com",
      );
      expect(valid).to.equal(false);
    });

    test("An invalid email address should return false", () => {
      const valid: boolean = checkEmailValidity("test.com");
      expect(valid).to.equal(false);
    });
  });

  describe("validateCreate()", () => {
    test("Throws a service error if the email address is malformed", async () => {
      try {
        await userValidator.validateCreate({
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
          isTKTDTStudent: false,
          lastSeq: 0,
        });
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Malformed email address.");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(400);
      }
    });

    test("Throws a service error if the email address is too long", async () => {
      try {
        await userValidator.validateCreate({
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
          isTKTDTStudent: false,
          lastSeq: 0,
        });
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Malformed email address.");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(400);
      }
    });

    test("Throws a service error if the passwords do not match", async () => {
      try {
        await userValidator.validateCreate({
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
          isTKTDTStudent: false,
          lastSeq: 0,
        });
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Passwords do not match.");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(400);
      }
    });

    test("If no errors occur, return nothing", async () => {
      await userValidator.validateCreate({
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
        isTKTDTStudent: false,
        lastSeq: 0,
      });
    });
  });

  describe("validateUpdate()", () => {
    test("Throws a service error when a normal user tries to modify a forbidden value", async () => {
      const user = await userDao.findOne(1);
      if (user === undefined) {
        throw new Error("User not found");
      }

      try {
        await userValidator.validateUpdate(user.id, { username: "test_user_123" }, new User(user));
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Forbidden modify action");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(403);
      }
    });

    test("Throws a service error when an elevated user" + " tries to set a malformed used email address", async () => {
      const user = await userDao.findOne(2);
      if (user === undefined) {
        throw new Error("User not found");
      }
      try {
        await userValidator.validateUpdate(1, { email: "test123" }, new User(user));
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Validation errors: Email address is malformed");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(400);
      }
    });

    test("Succeeds when an elevated user" + " tries to set his own used email address", async () => {
      const user = await userDao.findOne(2);
      expect(user).toBeDefined();
      await userValidator.validateUpdate(2, { email: "admin@user.com" }, new User(user!));
    });

    test("Throws a service error when a user" + " tries to set a new password that doesn't match", async () => {
      const user = await userDao.findOne(1);
      if (user === undefined) {
        throw new Error("User not found");
      }
      try {
        await userValidator.validateUpdate(
          1,
          { password1: "test_password", password2: "test_password2" },
          new User(user),
        );
        expect.fail("Expected to throw!");
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceError);
        expect(err.message).toBeDefined();
        expect(err.message).to.equal("Validation errors: Passwords do not match");
        expect(err.httpErrorCode).toBeDefined();
        expect(err.httpErrorCode).to.equal(400);
      }
    });

    test(
      "Throws a service error with two validation errors when a user" +
        " tries to set a new password that doesn't match and a malformed email",
      async () => {
        const user = await userDao.findOne(1);
        if (user === undefined) {
          throw new Error("User not found");
        }

        try {
          await userValidator.validateUpdate(
            1,
            { password1: "test_password", password2: "test_password2", email: "HelloWorld" },
            new User(user),
          );
          expect.fail("Expected to throw!");
        } catch (err) {
          expect(err).toBeInstanceOf(ServiceError);
          expect(err.message).toBeDefined();
          expect(err.message).to.equal("Validation errors: Email address is malformed, Passwords do not match");
          expect(err.httpErrorCode).toBeDefined();
          expect(err.httpErrorCode).to.equal(400);
        }
      },
    );

    test(
      "Throws a service error when a jasenvirkailija tries to" + " modify another user with a forbidden value",
      async () => {
        // Seed user #3 is a jasenvirkailija and wants to update a user.
        const user = await userDao.findOne(3);
        if (user === undefined) {
          throw new Error("User not found");
        }
        try {
          await userValidator.validateUpdate(2, { role: UserRoleString.Kayttaja }, new User(user));
          expect.fail("Expected to throw!");
        } catch (err) {
          expect(err).toBeInstanceOf(ServiceError);
          expect(err.message).toBeDefined();
          expect(err.message).to.equal("Forbidden modify action");
          expect(err.httpErrorCode).toBeDefined();
          expect(err.httpErrorCode).to.equal(403);
        }
      },
    );

    test("Succeeds when jasenvirkailija tries to" + " modify another user with a valid value", async () => {
      const user = await userDao.findOne(3);
      expect(user).toBeDefined();
      await userValidator.validateUpdate(2, { username: "tester" }, new User(user!));
    });

    test(
      "Throws a service error when a user" + " with an unknown set of permissions tries to modify another user",
      async () => {
        // Seed user #4 is a tenttiarkistovirkailija
        const user = await userDao.findOne(4);
        if (user === undefined) {
          throw new Error("User not found");
        }
        try {
          await userValidator.validateUpdate(1, { email: "test123" }, new User(user));
          expect.fail("Expected to throw!");
        } catch (err) {
          expect(err).toBeInstanceOf(ServiceError);
          expect(err.message).toBeDefined();
          expect(err.message).to.equal("Forbidden modify action");
          expect(err.httpErrorCode).toBeDefined();
          expect(err.httpErrorCode).to.equal(403);
        }
      },
    );
  });
});

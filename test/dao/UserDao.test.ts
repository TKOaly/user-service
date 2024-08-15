import { describe, test, beforeEach, afterEach, expect } from "vitest";
import users from "../../seeds/seedData/users";
import UserDao from "../../src/dao/UserDao";
import UserDatabaseObject from "../../src/interfaces/UserDatabaseObject";
import { knexInstance as knex } from "../../src/Db";
import { hashPasswordSync, legacyHashPassword } from "../../src/utils/UserHelpers";

process.env.NODE_ENV = "test";

const dbUsers = users;

const userDao = UserDao;

describe("UserDao", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test("Returns all users with all fields", async () => {
    const users = await userDao.findAll();

    expect(users.length).toBeDefined();
    expect(users.length).to.equal(dbUsers.length);

    users.forEach(user => {
      const dbUser = user;

      const seedUser = dbUsers.find(usr => usr.username === dbUser.username);

      if (seedUser === undefined) {
        throw new Error("Seeded user not found");
      }

      // Username
      expect(dbUser.username).toBeDefined();
      expect(dbUser.username).to.equal(seedUser.username);

      // Screen name
      expect(dbUser.screen_name).toBeDefined();
      expect(dbUser.screen_name).to.equal(seedUser.screen_name);

      // Salt
      expect(dbUser.salt).toBeDefined();
      expect(dbUser.salt).to.equal(seedUser.salt);

      // Role
      expect(dbUser.role).toBeDefined();
      expect(dbUser.role).to.equal(seedUser.role);

      // Residence
      expect(dbUser.residence).toBeDefined();
      expect(dbUser.residence).to.equal(seedUser.residence);

      // Phone
      expect(dbUser.phone).toBeDefined();
      expect(dbUser.phone).to.equal(seedUser.phone);

      // Name
      expect(dbUser.name).toBeDefined();
      expect(dbUser.name).to.equal(seedUser.name);

      // ModifiedAt
      expect(dbUser.modified).toBeDefined();

      // Membership
      expect(dbUser.membership).toBeDefined();
      expect(dbUser.membership).to.equal(seedUser.membership);

      // isTKTL
      expect(dbUser.tktl).toBeDefined();
      expect(dbUser.tktl).to.equal(seedUser.tktl);

      // isHYYMember
      expect(dbUser.hyy_member).toBeDefined();
      expect(dbUser.hyy_member).to.equal(seedUser.hyy_member);

      // isDeleted
      expect(dbUser.deleted).toBeDefined();
      expect(dbUser.deleted).to.equal(seedUser.deleted);

      // id
      expect(dbUser.id).toBeDefined();
      expect(dbUser.id).to.equal(seedUser.id);

      // hashedPassword
      expect(dbUser.hashed_password).toBeDefined();
      expect(dbUser.hashed_password).to.equal(seedUser.hashed_password);

      expect(dbUser.password_hash).toBeDefined();
      expect(dbUser.password_hash).to.equal(seedUser.password_hash);

      // email
      expect(dbUser.email).toBeDefined();
      expect(dbUser.email).to.equal(seedUser.email);

      // createdAt
      expect(dbUser.created).toBeDefined();
      expect(dbUser.created.toDateString()).to.equal(seedUser.created.toDateString());

      expect(dbUser.hy_staff).toBeDefined();
      expect(dbUser.hy_staff).to.equal(seedUser.hy_staff);

      expect(dbUser.hy_student).toBeDefined();
      expect(dbUser.hy_student).to.equal(seedUser.hy_student);
    });
  });

  test("Returns all users with only a few fields requested", async () => {
    const users = await userDao.findAll(["username", "name", "email"]);

    expect(users.length).toBeDefined();
    expect(users.length).to.equal(dbUsers.length);

    users.forEach(user => {
      const dbUser = user;

      const seedUser = dbUsers.find(usr => usr.username === dbUser.username);

      if (seedUser === undefined) {
        throw new Error("Seeded user not found");
      }

      // Username
      expect(dbUser.username).toBeDefined();
      expect(dbUser.username).to.equal(seedUser.username);

      // Screen name
      expect(dbUser.screen_name).not.toBeDefined();

      // Salt
      expect(dbUser.salt).not.toBeDefined();

      // Role
      expect(dbUser.role).not.toBeDefined();

      // Residence
      expect(dbUser.residence).not.toBeDefined();

      // Phone
      expect(dbUser.phone).not.toBeDefined();

      // Name
      expect(dbUser.name).toBeDefined();
      expect(dbUser.name).to.equal(seedUser.name);

      // ModifiedAt
      expect(dbUser.modified).not.toBeDefined();

      // Membership
      expect(dbUser.membership).not.toBeDefined();

      // isTKTL
      expect(dbUser.tktl).not.toBeDefined();

      // isHYYMember
      expect(dbUser.hyy_member).not.toBeDefined();

      // isDeleted
      expect(dbUser.deleted).not.toBeDefined();

      // id
      expect(dbUser.id).not.toBeDefined();

      // hashedPassword
      expect(dbUser.hashed_password).not.toBeDefined();
      expect(dbUser.password_hash).not.toBeDefined();

      // email
      expect(dbUser.email).toBeDefined();
      expect(dbUser.email).to.equal(seedUser.email);

      // createdAt
      expect(dbUser.created).not.toBeDefined();

      expect(dbUser.hy_staff).not.toBeDefined();
      expect(dbUser.hy_student).not.toBeDefined();
    });
  });

  test("Removes a user", async () => {
    const res = await userDao.remove(dbUsers[0].id);

    expect(res).to.equal(1);

    const users = await userDao.findAll();

    expect(users.length).to.equal(dbUsers.length - 1);
  });

  test("Inserts a new user", async () => {
    const newUser: Omit<UserDatabaseObject, "id"> = {
      username: "testuser",
      name: "Test User",
      screen_name: "testuser",
      email: "user@test.com",
      residence: "helsinki",
      phone: "12345",
      hyy_member: 1,
      membership: "member",
      role: "yllapitaja",
      salt: "12345",
      hashed_password: legacyHashPassword("12345", "test"),
      password_hash: hashPasswordSync("12345"),
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      tktl: 1,
      deleted: 0,
      hy_staff: 1,
      hy_student: 0,
      tktdt_student: 0,
      last_seq: 0,
    };

    const res = await userDao.save(newUser);

    expect(res.length).to.equal(1);

    const users = await userDao.findAll();

    expect(users.length).to.equal(dbUsers.length + 1);

    const dbUser = await userDao.findByUsername(newUser.username);

    if (dbUser === undefined) {
      throw new Error("User not found");
    }

    expect(dbUser.username).to.equal(newUser.username);
    expect(dbUser.name).to.equal(newUser.name);
    expect(dbUser.screen_name).to.equal(newUser.screen_name);
    expect(dbUser.email).to.equal(newUser.email);
    expect(dbUser.residence).to.equal(newUser.residence);
    expect(dbUser.phone).to.equal(newUser.phone);
    expect(dbUser.hyy_member).to.equal(newUser.hyy_member);
    expect(dbUser.membership).to.equal(newUser.membership);
    expect(dbUser.role).to.equal(newUser.role);
    expect(dbUser.salt).to.equal(newUser.salt);
    expect(dbUser.tktl).to.equal(newUser.tktl);
    expect(dbUser.deleted).to.equal(newUser.deleted);
    expect(dbUser.hy_staff).to.equal(newUser.hy_staff);
    expect(dbUser.hy_student).to.equal(newUser.hy_student);
    expect(dbUser.tktdt_student).to.equal(newUser.tktdt_student);
    expect(dbUser.last_seq).to.equal(newUser.last_seq);
  });

  test("Returns a single user with findOne()", async () => {
    const dbUser = await userDao.findOne(dbUsers[0].id);
    const seedUser = dbUsers[0];
    if (dbUser === undefined) {
      throw new Error("User not found");
    }

    // Username
    expect(dbUser.username).toBeDefined();
    expect(dbUser.username).to.equal(seedUser.username);

    // Screen name
    expect(dbUser.screen_name).toBeDefined();
    expect(dbUser.screen_name).to.equal(seedUser.screen_name);

    // Salt
    expect(dbUser.salt).toBeDefined();
    expect(dbUser.salt).to.equal(seedUser.salt);

    // Role
    expect(dbUser.role).toBeDefined();
    expect(dbUser.role).to.equal(seedUser.role);

    // Residence
    expect(dbUser.residence).toBeDefined();
    expect(dbUser.residence).to.equal(seedUser.residence);

    // Phone
    expect(dbUser.phone).toBeDefined();
    expect(dbUser.phone).to.equal(seedUser.phone);

    // Name
    expect(dbUser.name).toBeDefined();
    expect(dbUser.name).to.equal(seedUser.name);

    // ModifiedAt
    expect(dbUser.modified).toBeDefined();

    // Membership
    expect(dbUser.membership).toBeDefined();
    expect(dbUser.membership).to.equal(seedUser.membership);

    // isTKTL
    expect(dbUser.tktl).toBeDefined();
    expect(dbUser.tktl).to.equal(seedUser.tktl);

    // isHYYMember
    expect(dbUser.hyy_member).toBeDefined();
    expect(dbUser.hyy_member).to.equal(seedUser.hyy_member);

    // isDeleted
    expect(dbUser.deleted).toBeDefined();
    expect(dbUser.deleted).to.equal(seedUser.deleted);

    // isHyStudent
    expect(dbUser.hy_student).toBeDefined();
    expect(dbUser.hy_student).to.equal(seedUser.hy_student);

    // isHyStaff
    expect(dbUser.hy_staff).toBeDefined();
    expect(dbUser.hy_staff).to.equal(seedUser.hy_staff);

    // id
    expect(dbUser.id).toBeDefined();
    expect(dbUser.id).to.equal(seedUser.id);

    // hashedPassword
    expect(dbUser.hashed_password).toBeDefined();
    expect(dbUser.hashed_password).to.equal(seedUser.hashed_password);

    expect(dbUser.password_hash).toBeDefined();
    expect(dbUser.password_hash).to.equal(seedUser.password_hash);

    // email
    expect(dbUser.email).toBeDefined();
    expect(dbUser.email).to.equal(seedUser.email);

    // createdAt
    expect(dbUser.created).toBeDefined();
    expect(dbUser.created.toDateString()).to.equal(seedUser.created.toDateString());
  });

  test("Returns a single user with findByUsername()", async () => {
    const dbUser = await userDao.findByUsername(dbUsers[0].username);
    const seedUser = dbUsers[0];
    if (dbUser === undefined) {
      throw new Error("User not found");
    }
    // Username
    expect(dbUser.username).toBeDefined();
    expect(dbUser.username).to.equal(seedUser.username);

    // Screen name
    expect(dbUser.screen_name).toBeDefined();
    expect(dbUser.screen_name).to.equal(seedUser.screen_name);

    // Salt
    expect(dbUser.salt).toBeDefined();
    expect(dbUser.salt).to.equal(seedUser.salt);

    // Role
    expect(dbUser.role).toBeDefined();
    expect(dbUser.role).to.equal(seedUser.role);

    // Residence
    expect(dbUser.residence).toBeDefined();
    expect(dbUser.residence).to.equal(seedUser.residence);

    // Phone
    expect(dbUser.phone).toBeDefined();
    expect(dbUser.phone).to.equal(seedUser.phone);

    // Name
    expect(dbUser.name).toBeDefined();
    expect(dbUser.name).to.equal(seedUser.name);

    // ModifiedAt
    expect(dbUser.modified).toBeDefined();

    // Membership
    expect(dbUser.membership).toBeDefined();
    expect(dbUser.membership).to.equal(seedUser.membership);

    // isTKTL
    expect(dbUser.tktl).toBeDefined();
    expect(dbUser.tktl).to.equal(seedUser.tktl);

    // isHYYMember
    expect(dbUser.hyy_member).toBeDefined();
    expect(dbUser.hyy_member).to.equal(seedUser.hyy_member);

    // isDeleted
    expect(dbUser.deleted).toBeDefined();
    expect(dbUser.deleted).to.equal(seedUser.deleted);

    // id
    expect(dbUser.id).toBeDefined();
    expect(dbUser.id).to.equal(seedUser.id);

    // hashedPassword
    expect(dbUser.hashed_password).toBeDefined();
    expect(dbUser.hashed_password).to.equal(seedUser.hashed_password);
    expect(dbUser.password_hash).toBeDefined();
    expect(dbUser.password_hash).to.equal(seedUser.password_hash);

    // email
    expect(dbUser.email).toBeDefined();
    expect(dbUser.email).to.equal(seedUser.email);

    // isHyStudent
    expect(dbUser.hy_student).toBeDefined();
    expect(dbUser.hy_student).to.equal(seedUser.hy_student);

    // isHyStaff
    expect(dbUser.hy_staff).toBeDefined();
    expect(dbUser.hy_staff).to.equal(seedUser.hy_staff);

    // createdAt
    expect(dbUser.created).toBeDefined();
    expect(dbUser.created.toDateString()).to.equal(seedUser.created.toDateString());
  });

  test("Returns a single user with findWhere()", async () => {
    const dbUsers = await userDao.findWhere("Test User");

    const seedUser = dbUsers.find(usr => usr.username === "test_user");
    if (seedUser === undefined) {
      throw new Error("Seeded user not found");
    }

    expect(dbUsers.length).to.equal(1);

    const dbUser = dbUsers[0];

    // Username
    expect(dbUser.username).toBeDefined();
    expect(dbUser.username).to.equal(seedUser.username);

    // Screen name
    expect(dbUser.screen_name).toBeDefined();
    expect(dbUser.screen_name).to.equal(seedUser.screen_name);

    // Salt
    expect(dbUser.salt).toBeDefined();
    expect(dbUser.salt).to.equal(seedUser.salt);

    // Role
    expect(dbUser.role).toBeDefined();
    expect(dbUser.role).to.equal(seedUser.role);

    // Residence
    expect(dbUser.residence).toBeDefined();
    expect(dbUser.residence).to.equal(seedUser.residence);

    // Phone
    expect(dbUser.phone).toBeDefined();
    expect(dbUser.phone).to.equal(seedUser.phone);

    // Name
    expect(dbUser.name).toBeDefined();
    expect(dbUser.name).to.equal(seedUser.name);

    // ModifiedAt
    expect(dbUser.modified).toBeDefined();

    // Membership
    expect(dbUser.membership).toBeDefined();
    expect(dbUser.membership).to.equal(seedUser.membership);

    // isTKTL
    expect(dbUser.tktl).toBeDefined();
    expect(dbUser.tktl).to.equal(seedUser.tktl);

    // isHYYMember
    expect(dbUser.hyy_member).toBeDefined();
    expect(dbUser.hyy_member).to.equal(seedUser.hyy_member);

    // isDeleted
    expect(dbUser.deleted).toBeDefined();
    expect(dbUser.deleted).to.equal(seedUser.deleted);

    // isHyStudent
    expect(dbUser.hy_student).toBeDefined();
    expect(dbUser.hy_student).to.equal(seedUser.hy_student);

    // isHyStaff
    expect(dbUser.hy_staff).toBeDefined();
    expect(dbUser.hy_staff).to.equal(seedUser.hy_staff);

    // id
    expect(dbUser.id).toBeDefined();
    expect(dbUser.id).to.equal(seedUser.id);

    // hashedPassword
    expect(dbUser.hashed_password).toBeDefined();
    expect(dbUser.hashed_password).to.equal(seedUser.hashed_password);
    expect(dbUser.password_hash).toBeDefined();
    expect(dbUser.password_hash).to.equal(seedUser.password_hash);

    // email
    expect(dbUser.email).toBeDefined();
    expect(dbUser.email).to.equal(seedUser.email);

    // createdAt
    expect(dbUser.created).toBeDefined();
    expect(dbUser.created.toDateString()).to.equal(seedUser.created.toDateString());
  });

  test("Editing a user should update modifiedAt timestamp, but not createdAt", async () => {
    const user = await userDao.findOne(1);

    if (user === undefined) {
      throw new Error("User not found");
    }

    const createdAt = user.created;
    const modifiedAt = user.modified;
    const createdAtString = createdAt.toISOString();
    const modifiedAtString = modifiedAt.toISOString();
    const updatedUsername = "testUsername";

    await userDao.update(1, {
      username: updatedUsername,
    });

    const user2 = await userDao.findOne(1);

    if (user2 === undefined) {
      throw new Error("User not found");
    }

    expect(createdAtString).to.equal(user2.created.toISOString());
    expect(modifiedAtString).to.not.equal(user2.modified.toISOString());
  });

  test("should return undefined if user is not found", async () => {
    const user = await userDao.findOne(999);
    expect(user).not.toBeDefined();
  });
});

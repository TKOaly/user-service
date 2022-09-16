import "mocha";
import users from "../../seeds/seedData/users";
import UserDao from "../../src/dao/UserDao";
import UserDatabaseObject from "../../src/interfaces/UserDatabaseObject";
import { knexInstance } from "../../src/Db";

import sha1 from "sha1";

import chai = require("chai");
process.env.NODE_ENV = "test";

const dbUsers = users;
const should = chai.should();
// Knex instance
const knex = knexInstance;

const userDao = UserDao;
const encryptPassword: (password: string, salt: string) => string = (password: string, salt: string): string =>
  sha1(salt + "kekbUr" + password);

describe("UserDao", () => {
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

  it("Returns all users with all fields", async () => {
    const users = await userDao.findAll()

    should.exist(users.length);
    users.length.should.equal(dbUsers.length);

    users.forEach((user) => {
      const dbUser = user;

      const seedUser = dbUsers.find(usr => usr.username === dbUser.username);

      if (seedUser === undefined) {
        throw new Error("Seeded user not found");
      }

      // Username
      should.exist(dbUser.username);
      dbUser.username.should.equal(seedUser.username);

      // Screen name
      should.exist(dbUser.screen_name);
      dbUser.screen_name.should.equal(seedUser.screen_name);

      // Salt
      should.exist(dbUser.salt);
      dbUser.salt.should.equal(seedUser.salt);

      // Role
      should.exist(dbUser.role);
      dbUser.role.should.equal(seedUser.role);

      // Residence
      should.exist(dbUser.residence);
      dbUser.residence.should.equal(seedUser.residence);

      // Phone
      should.exist(dbUser.phone);
      dbUser.phone.should.equal(seedUser.phone);

      // Name
      should.exist(dbUser.name);
      dbUser.name.should.equal(seedUser.name);

      // ModifiedAt
      should.exist(dbUser.modified);

      // Membership
      should.exist(dbUser.membership);
      dbUser.membership.should.equal(seedUser.membership);

      // isTKTL
      should.exist(dbUser.tktl);
      dbUser.tktl.should.equal(seedUser.tktl);

      // isHYYMember
      should.exist(dbUser.hyy_member);
      dbUser.hyy_member.should.equal(seedUser.hyy_member);

      // isDeleted
      should.exist(dbUser.deleted);
      dbUser.deleted.should.equal(seedUser.deleted);

      // id
      should.exist(dbUser.id);
      dbUser.id.should.equal(seedUser.id);

      // hashedPassword
      should.exist(dbUser.hashed_password);
      dbUser.hashed_password.should.equal(seedUser.hashed_password);

      // email
      should.exist(dbUser.email);
      dbUser.email.should.equal(seedUser.email);

      // createdAt
      should.exist(dbUser.created);
      dbUser.created.toDateString().should.equal(seedUser.created.toDateString());

      should.exist(dbUser.hy_staff);
      dbUser.hy_staff.should.equal(seedUser.hy_staff);

      should.exist(dbUser.hy_student);
      dbUser.hy_student.should.equal(seedUser.hy_student);
    });
  });

  it("Returns all users with only a few fields requested", async () => {
    const users = await userDao.findAll(["username", "name", "email"])

    should.exist(users.length);
    users.length.should.equal(dbUsers.length);

    users.forEach(user => {
      const dbUser = user;

      const seedUser = dbUsers.find(usr => usr.username === dbUser.username);

      if (seedUser === undefined) {
        throw new Error("Seeded user not found");
      }

      // Username
      should.exist(dbUser.username);
      dbUser.username.should.equal(seedUser.username);

      // Screen name
      should.not.exist(dbUser.screen_name);

      // Salt
      should.not.exist(dbUser.salt);

      // Role
      should.not.exist(dbUser.role);

      // Residence
      should.not.exist(dbUser.residence);

      // Phone
      should.not.exist(dbUser.phone);

      // Name
      should.exist(dbUser.name);
      dbUser.name.should.equal(seedUser.name);

      // ModifiedAt
      should.not.exist(dbUser.modified);

      // Membership
      should.not.exist(dbUser.membership);

      // isTKTL
      should.not.exist(dbUser.tktl);

      // isHYYMember
      should.not.exist(dbUser.hyy_member);

      // isDeleted
      should.not.exist(dbUser.deleted);

      // id
      should.not.exist(dbUser.id);

      // hashedPassword
      should.not.exist(dbUser.hashed_password);

      // email
      should.exist(dbUser.email);
      dbUser.email.should.equal(seedUser.email);

      // createdAt
      should.not.exist(dbUser.created);

      should.not.exist(dbUser.hy_staff);
      should.not.exist(dbUser.hy_student);
    });
  });

  it("Removes a user", async () => {
    const res = await userDao.remove(dbUsers[0].id)

    res.should.equal(1);

    const users = await userDao.findAll()
    
    users.length.should.equal(dbUsers.length - 1);
  });

  it("Inserts a new user", async () => {
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
      hashed_password: encryptPassword("12345", "test"),
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      tktl: 1,
      deleted: 0,
      hy_staff: 1,
      hy_student: 0,
    };

    // @ts-expect-error
    const res = await userDao.save(newUser)

    res.length.should.equal(1);

    const users = await userDao.findAll()

    users.length.should.equal(dbUsers.length + 1);

    const dbUser = await userDao.findByUsername(newUser.username)

    if (dbUser === undefined) {
      throw new Error("User not found");
    }

    dbUser.username.should.equal(newUser.username);
    dbUser.name.should.equal(newUser.name);
    dbUser.screen_name.should.equal(newUser.screen_name);
    dbUser.email.should.equal(newUser.email);
    dbUser.residence.should.equal(newUser.residence);
    dbUser.phone.should.equal(newUser.phone);
    dbUser.hyy_member.should.equal(newUser.hyy_member);
    dbUser.membership.should.equal(newUser.membership);
    dbUser.role.should.equal(newUser.role);
    dbUser.salt.should.equal(newUser.salt);
    dbUser.tktl.should.equal(newUser.tktl);
    dbUser.deleted.should.equal(newUser.deleted);
    dbUser.hy_staff.should.equal(newUser.hy_staff);
    dbUser.hy_student.should.equal(newUser.hy_student);
  });

  it("Returns a single user with findOne()", done => {
    userDao.findOne(dbUsers[0].id).then(dbUser => {
      const seedUser = dbUsers[0];
      if (dbUser === undefined) {
        throw new Error("User not found");
      }

      // Username
      should.exist(dbUser.username);
      dbUser.username.should.equal(seedUser.username);

      // Screen name
      should.exist(dbUser.screen_name);
      dbUser.screen_name.should.equal(seedUser.screen_name);

      // Salt
      should.exist(dbUser.salt);
      dbUser.salt.should.equal(seedUser.salt);

      // Role
      should.exist(dbUser.role);
      dbUser.role.should.equal(seedUser.role);

      // Residence
      should.exist(dbUser.residence);
      dbUser.residence.should.equal(seedUser.residence);

      // Phone
      should.exist(dbUser.phone);
      dbUser.phone.should.equal(seedUser.phone);

      // Name
      should.exist(dbUser.name);
      dbUser.name.should.equal(seedUser.name);

      // ModifiedAt
      should.exist(dbUser.modified);

      // Membership
      should.exist(dbUser.membership);
      dbUser.membership.should.equal(seedUser.membership);

      // isTKTL
      should.exist(dbUser.tktl);
      dbUser.tktl.should.equal(seedUser.tktl);

      // isHYYMember
      should.exist(dbUser.hyy_member);
      dbUser.hyy_member.should.equal(seedUser.hyy_member);

      // isDeleted
      should.exist(dbUser.deleted);
      dbUser.deleted.should.equal(seedUser.deleted);

      // isHyStudent
      should.exist(dbUser.hy_student);
      dbUser.hy_student.should.equal(seedUser.hy_student);

      // isHyStaff
      should.exist(dbUser.hy_staff);
      dbUser.hy_staff.should.equal(seedUser.hy_staff);

      // id
      should.exist(dbUser.id);
      dbUser.id.should.equal(seedUser.id);

      // hashedPassword
      should.exist(dbUser.hashed_password);
      dbUser.hashed_password.should.equal(seedUser.hashed_password);

      // email
      should.exist(dbUser.email);
      dbUser.email.should.equal(seedUser.email);

      // createdAt
      should.exist(dbUser.created);
      dbUser.created.toDateString().should.equal(seedUser.created.toDateString());

      done();
    });
  });

  it("Returns a single user with findByUsername()", done => {
    userDao.findByUsername(dbUsers[0].username).then(dbUser => {
      const seedUser = dbUsers[0];
      if (dbUser === undefined) {
        throw new Error("User not found");
      }
      // Username
      should.exist(dbUser.username);
      dbUser.username.should.equal(seedUser.username);

      // Screen name
      should.exist(dbUser.screen_name);
      dbUser.screen_name.should.equal(seedUser.screen_name);

      // Salt
      should.exist(dbUser.salt);
      dbUser.salt.should.equal(seedUser.salt);

      // Role
      should.exist(dbUser.role);
      dbUser.role.should.equal(seedUser.role);

      // Residence
      should.exist(dbUser.residence);
      dbUser.residence.should.equal(seedUser.residence);

      // Phone
      should.exist(dbUser.phone);
      dbUser.phone.should.equal(seedUser.phone);

      // Name
      should.exist(dbUser.name);
      dbUser.name.should.equal(seedUser.name);

      // ModifiedAt
      should.exist(dbUser.modified);

      // Membership
      should.exist(dbUser.membership);
      dbUser.membership.should.equal(seedUser.membership);

      // isTKTL
      should.exist(dbUser.tktl);
      dbUser.tktl.should.equal(seedUser.tktl);

      // isHYYMember
      should.exist(dbUser.hyy_member);
      dbUser.hyy_member.should.equal(seedUser.hyy_member);

      // isDeleted
      should.exist(dbUser.deleted);
      dbUser.deleted.should.equal(seedUser.deleted);

      // id
      should.exist(dbUser.id);
      dbUser.id.should.equal(seedUser.id);

      // hashedPassword
      should.exist(dbUser.hashed_password);
      dbUser.hashed_password.should.equal(seedUser.hashed_password);

      // email
      should.exist(dbUser.email);
      dbUser.email.should.equal(seedUser.email);

      // isHyStudent
      should.exist(dbUser.hy_student);
      dbUser.hy_student.should.equal(seedUser.hy_student);

      // isHyStaff
      should.exist(dbUser.hy_staff);
      dbUser.hy_staff.should.equal(seedUser.hy_staff);

      // createdAt
      should.exist(dbUser.created);
      dbUser.created.toDateString().should.equal(seedUser.created.toDateString());

      done();
    });
  });

  it("Returns a single user with findWhere()", done => {
    userDao.findWhere("Test User").then(dbUsers => {
      const seedUser = dbUsers.find(usr => usr.username === "test_user");
      if (seedUser === undefined) {
        throw new Error("Seeded user not found");
      }

      dbUsers.length.should.equal(1);

      const dbUser = dbUsers[0];

      // Username
      should.exist(dbUser.username);
      dbUser.username.should.equal(seedUser.username);

      // Screen name
      should.exist(dbUser.screen_name);
      dbUser.screen_name.should.equal(seedUser.screen_name);

      // Salt
      should.exist(dbUser.salt);
      dbUser.salt.should.equal(seedUser.salt);

      // Role
      should.exist(dbUser.role);
      dbUser.role.should.equal(seedUser.role);

      // Residence
      should.exist(dbUser.residence);
      dbUser.residence.should.equal(seedUser.residence);

      // Phone
      should.exist(dbUser.phone);
      dbUser.phone.should.equal(seedUser.phone);

      // Name
      should.exist(dbUser.name);
      dbUser.name.should.equal(seedUser.name);

      // ModifiedAt
      should.exist(dbUser.modified);

      // Membership
      should.exist(dbUser.membership);
      dbUser.membership.should.equal(seedUser.membership);

      // isTKTL
      should.exist(dbUser.tktl);
      dbUser.tktl.should.equal(seedUser.tktl);

      // isHYYMember
      should.exist(dbUser.hyy_member);
      dbUser.hyy_member.should.equal(seedUser.hyy_member);

      // isDeleted
      should.exist(dbUser.deleted);
      dbUser.deleted.should.equal(seedUser.deleted);

      // isHyStudent
      should.exist(dbUser.hy_student);
      dbUser.hy_student.should.equal(seedUser.hy_student);

      // isHyStaff
      should.exist(dbUser.hy_staff);
      dbUser.hy_staff.should.equal(seedUser.hy_staff);

      // id
      should.exist(dbUser.id);
      dbUser.id.should.equal(seedUser.id);

      // hashedPassword
      should.exist(dbUser.hashed_password);
      dbUser.hashed_password.should.equal(seedUser.hashed_password);

      // email
      should.exist(dbUser.email);
      dbUser.email.should.equal(seedUser.email);

      // createdAt
      should.exist(dbUser.created);
      dbUser.created.toDateString().should.equal(seedUser.created.toDateString());

      done();
    });
  });

  it("Editing a user should update modifiedAt timestamp, but not createdAt", async () => {
    const user = await userDao.findOne(1)

    if (user === undefined) {
      throw new Error("User not found");
    }

    const createdAt = user.created;
    const modifiedAt = user.modified;
    const createdAtString = createdAt.toISOString();
    const modifiedAtString = modifiedAt.toISOString();
    const updatedUsername = "testUsername";

    await userDao
      .update(1, {
        username: updatedUsername,
      })

    const user2 = await userDao.findOne(1)

    if (user2 === undefined) {
      throw new Error("User not found");
    }

    createdAtString.should.equal(user2.created.toISOString());
    modifiedAtString.should.not.equal(user2.modified.toISOString());
  });

  it("should return undefined if user is not found", done => {
    userDao.findOne(999).then(user => {
      should.not.exist(user);
      done();
    });
  });
});

process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
import IUserDatabaseObject from "../../src/interfaces/IUserDatabaseObject";
import UserDao from "./../../src/dao/UserDao";

import userFile = require("./../../seeds/seedData/users");
const dbUsers: IUserDatabaseObject[] = userFile as IUserDatabaseObject[];

const chai: Chai.ChaiStatic = require("chai");
const should: Chai.Should = chai.should();

// Knexfile
const knexfile: any = require("./../../knexfile");
// Knex instance
const knex: any = Knex(knexfile.test);

const userDao: UserDao = new UserDao(knex);

// @ts-ignore
const sha1: any = require("sha1");
// @ts-ignore
const encryptPassword: (password: string, salt: string) => string = (
  password: string,
  salt: string
): string => sha1(salt + "kekbUr" + password);

describe("UserDao", () => {
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

  it("Returns all users with all fields", (done: Mocha.Done) => {
    userDao.findAll().then((users: IUserDatabaseObject[]) => {
      should.exist(users.length);
      users.length.should.equal(dbUsers.length);
      users.forEach((user: IUserDatabaseObject) => {
        const dbUser: IUserDatabaseObject = user;

        const seedUser: IUserDatabaseObject = dbUsers.find(
          (usr: IUserDatabaseObject) => usr.username === dbUser.username
        );

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
        dbUser.created
          .toDateString()
          .should.equal(seedUser.created.toDateString());
      });

      done();
    });
  });

  it("Returns all users with only a few fields requested", (done: Mocha.Done) => {
    userDao
      .findAll(["username", "name", "email"])
      .then((users: IUserDatabaseObject[]) => {
        should.exist(users.length);
        users.length.should.equal(dbUsers.length);
        users.forEach((user: IUserDatabaseObject) => {

          const dbUser: IUserDatabaseObject = user;

          const seedUser: IUserDatabaseObject = dbUsers.find(
            (usr: IUserDatabaseObject) => usr.username === dbUser.username
          );

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
        });

        done();
      });
  });

  it("Removes a user", (done: Mocha.Done) => {
    userDao.remove(dbUsers[0].id).then((res: boolean) => {
      res.should.equal(1);
      userDao.findAll().then((users: IUserDatabaseObject[]) => {
        users.length.should.equal(dbUsers.length - 1);
        done();
      });
    });
  });

  it("Inserts a new user", (done: Mocha.Done) => {
    const newUser: IUserDatabaseObject = {
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
      hashed_password: encryptPassword("12345", this.salt),
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      tktl: 1,
      deleted: 0
    };

    userDao.save(newUser).then((res: number[]) => {
      res.length.should.equal(1);
      userDao.findAll().then((users: IUserDatabaseObject[]) => {
        users.length.should.equal(dbUsers.length + 1);
        userDao
          .findByUsername(newUser.username)
          .then((dbUser: IUserDatabaseObject) => {
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
            done();
          });
      });
    });
  });

  it("Returns a single user with findOne()", (done: Mocha.Done) => {
    userDao.findOne(dbUsers[0].id).then((dbUser: IUserDatabaseObject) => {
      const seedUser: IUserDatabaseObject = dbUsers[0];

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
      dbUser.created
        .toDateString()
        .should.equal(seedUser.created.toDateString());

      done();
    });
  });

  it("Returns a single user with findWhere()", (done: Mocha.Done) => {
    userDao.findWhere("Test User").then((dbUsers: IUserDatabaseObject[]) => {
      const seedUser: IUserDatabaseObject = dbUsers.find(
        (usr: IUserDatabaseObject) => usr.username === "test_user"
      );
      dbUsers.length.should.equal(1);

      const dbUser: IUserDatabaseObject = dbUsers[0];

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
      dbUser.created
        .toDateString()
        .should.equal(seedUser.created.toDateString());

      done();
    });
  });
});

process.env.NODE_ENV = "test";

import "mocha";
import UserRoleString from "../../src/enum/UserRoleString";
import IUserDatabaseObject from "../../src/interfaces/IUserDatabaseObject";
import User from "../../src/models/User";
import { compareRoles } from "../../src/utils/UserHelpers";

import chai = require("chai");
const should: Chai.Should = chai.should();

let user: User;

describe("User model", () => {
  beforeEach((done: Mocha.Done) => {
    user = new User({
      id: 1,
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
      hashed_password: "12345",
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      tktl: 1,
      deleted: 0
    });
    done();
  });

  it("Sets data correctly", (done: Mocha.Done) => {
    user.id.should.equal(1);
    user.username.should.equal("testuser");
    user.name.should.equal("Test User");
    user.screenName.should.equal("testuser");
    user.email.should.equal("user@test.com");
    user.residence.should.equal("helsinki");
    user.phone.should.equal("12345");
    user.isHYYMember.should.equal(true);
    user.membership.should.equal("member");
    user.role.should.equal("yllapitaja");
    user.salt.should.equal("12345");
    user.hashedPassword.should.equal("12345");
    user.createdAt
      .toDateString()
      .should
      .equal(new Date(2017, 1, 1).toDateString());
    user.modifiedAt
      .toDateString()
      .should
      .equal(new Date(2017, 1, 1).toDateString());
    user.isTKTL.should.equal(true);
    user.isDeleted.should.equal(false);
    done();
  });

  it("Removing sensitive data should remove salt and hashed_password", (done: Mocha.Done) => {
    should.exist(user.hashedPassword);
    should.exist(user.salt);
    const newUser: User = user.removeSensitiveInformation();
    should.not.exist(newUser.hashedPassword);
    should.not.exist(newUser.salt);
    done();
  });

  it("Requesting database object should return correct information", (done: Mocha.Done) => {
    const userDatabaseObject: IUserDatabaseObject = user.getDatabaseObject();
    // Username
    should.exist(userDatabaseObject.username);
    userDatabaseObject.username.should.equal(user.username);
    // TKTL
    should.exist(userDatabaseObject.tktl);
    userDatabaseObject.tktl.should.equal(Number(user.isTKTL));
    // Screen name
    should.exist(userDatabaseObject.screen_name);
    userDatabaseObject.screen_name.should.equal(user.screenName);
    // Salt
    should.exist(userDatabaseObject.salt);
    userDatabaseObject.salt.should.equal(user.salt);
    // Role
    should.exist(userDatabaseObject.role);
    userDatabaseObject.role.should.equal(user.role);
    // Residence
    should.exist(userDatabaseObject.residence);
    userDatabaseObject.residence.should.equal(user.residence);
    // Phone
    should.exist(userDatabaseObject.phone);
    userDatabaseObject.phone.should.equal(user.phone);
    // Name
    should.exist(userDatabaseObject.name);
    userDatabaseObject.name.should.equal(user.name);
    // Membership
    should.exist(userDatabaseObject.membership);
    userDatabaseObject.membership.should.equal(user.membership);
    // ID
    should.exist(userDatabaseObject.id);
    userDatabaseObject.id.should.equal(user.id);
    // HYY member
    should.exist(userDatabaseObject.hyy_member);
    userDatabaseObject.hyy_member.should.equal(Number(user.isHYYMember));
    // Hashed password
    should.exist(userDatabaseObject.hashed_password);
    userDatabaseObject.hashed_password.should.equal(user.hashedPassword);
    // Email
    should.exist(userDatabaseObject.email);
    userDatabaseObject.email.should.equal(user.email);
    // Deleted
    should.exist(userDatabaseObject.deleted);
    userDatabaseObject.deleted.should.equal(user.isDeleted);
    // Created
    should.exist(userDatabaseObject.created);
    userDatabaseObject.created.should.equal(user.createdAt);
    done();
  });

  it("Requesting only id should only return id", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 0));
    should.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only username should only return username", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 1));
    should.not.exist(newUser.id);
    should.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only name should only return name", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 2));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only screenName should only return screenName", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 3));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only email should only return email", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 4));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only residence should only return residence", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 5));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only phone should only return phone", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 6));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only isHYYMember should only return isHYYMember", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 7));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only membership should only return membership", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 8));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only role should only return role", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 9));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only salt should not return salt", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 10));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it("Requesting only hashedPassword should not return hashedPassword", (done: Mocha.Done) => {
    const newUser: User = user.removeNonRequestedData(Math.pow(2, 11));
    should.not.exist(newUser.id);
    should.not.exist(newUser.username);
    should.not.exist(newUser.name);
    should.not.exist(newUser.screenName);
    should.not.exist(newUser.email);
    should.not.exist(newUser.residence);
    should.not.exist(newUser.phone);
    should.not.exist(newUser.isHYYMember);
    should.not.exist(newUser.membership);
    should.not.exist(newUser.role);
    should.not.exist(newUser.salt);
    should.not.exist(newUser.hashedPassword);
    done();
  });

  it(
    "Requesting username, name, email and membership should" +
      " only return username, name, email and membership",
    (done: Mocha.Done) => {
      const newUser: User = user.removeNonRequestedData(
        Math.pow(2, 1) | Math.pow(2, 2) | Math.pow(2, 4) | Math.pow(2, 8)
      );
      should.not.exist(newUser.id);
      should.exist(newUser.username);
      should.exist(newUser.name);
      should.not.exist(newUser.screenName);
      should.exist(newUser.email);
      should.not.exist(newUser.residence);
      should.not.exist(newUser.phone);
      should.not.exist(newUser.isHYYMember);
      should.exist(newUser.membership);
      should.not.exist(newUser.role);
      should.not.exist(newUser.salt);
      should.not.exist(newUser.hashedPassword);
      done();
    }
  );

  describe("compareRoles()", () => {
    it("aN == bN should return 0", (done: Mocha.Done) => {
      let role1: UserRoleString = UserRoleString.Jasenvirkailija;
      let role2: UserRoleString = UserRoleString.Jasenvirkailija;
      let roleCompare: number = compareRoles(role1, role2);
      roleCompare.should.equal(0);

      role1 = UserRoleString.Kayttaja;
      role2 = UserRoleString.Kayttaja;
      roleCompare = compareRoles(role1, role2);
      roleCompare.should.equal(0);

      role1 = UserRoleString.Tenttiarkistovirkailija;
      role2 = UserRoleString.Tenttiarkistovirkailija;
      roleCompare = compareRoles(role1, role2);
      roleCompare.should.equal(0);

      role1 = UserRoleString.Virkailija;
      role2 = UserRoleString.Virkailija;
      roleCompare = compareRoles(role1, role2);
      roleCompare.should.equal(0);

      role1 = UserRoleString.Yllapitaja;
      role2 = UserRoleString.Yllapitaja;
      roleCompare = compareRoles(role1, role2);
      roleCompare.should.equal(0);

      done();
    });

    it("aN < bN should return -1", (done: Mocha.Done) => {
      let role1: UserRoleString = UserRoleString.Jasenvirkailija;
      let role2: UserRoleString = UserRoleString.Kayttaja;
      let roleCompare: number = compareRoles(role1, role2);
      roleCompare.should.equal(1);

      role1 = UserRoleString.Yllapitaja;
      role2 = UserRoleString.Virkailija;
      roleCompare = compareRoles(role1, role2);
      roleCompare.should.equal(1);

      done();
    });

    it("aN > bN should return 1", (done: Mocha.Done) => {
      const role1: UserRoleString = UserRoleString.Jasenvirkailija;
      const role2: UserRoleString = UserRoleString.Kayttaja;
      const roleCompare: number = compareRoles(role2, role1);

      roleCompare.should.equal(-1);

      done();
    });
  });
});

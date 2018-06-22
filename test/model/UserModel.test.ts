process.env.NODE_ENV = "test";

import "mocha";
import User from "./../../src/models/User";
const chai: Chai.ChaiStatic = require("chai");
const should: Chai.Should = chai.should();

let user: User;

describe("User model", () => {
  beforeEach((done) => {
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

  it("Sets data correctly", (done) => {
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
      .should.equal(new Date(2017, 1, 1).toDateString());
    user.modifiedAt
      .toDateString()
      .should.equal(new Date(2017, 1, 1).toDateString());
    user.isTKTL.should.equal(true);
    user.isDeleted.should.equal(false);
    done();
  });

  it("Removing sensitive data should remove salt and hashed_password", (done) => {
    should.exist(user.hashedPassword);
    should.exist(user.salt);
    const newUser: User = user.removeSensitiveInformation();
    should.not.exist(newUser.hashedPassword);
    should.not.exist(newUser.salt);
    done();
  });

  it("Requesting only id should only return id", (done) => {
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

  it("Requesting only username should only return username", (done) => {
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

  it("Requesting only name should only return name", (done) => {
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

  it("Requesting only screenName should only return screenName", (done) => {
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

  it("Requesting only email should only return email", (done) => {
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

  it("Requesting only residence should only return residence", (done) => {
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

  it("Requesting only phone should only return phone", (done) => {
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

  it("Requesting only isHYYMember should only return isHYYMember", (done) => {
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

  it("Requesting only membership should only return membership", (done) => {
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

  it("Requesting only role should only return role", (done) => {
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

  it("Requesting only salt should not return salt", (done) => {
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

  it("Requesting only hashedPassword should not return hashedPassword", (done) => {
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
    (done) => {
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
});

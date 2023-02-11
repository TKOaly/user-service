import "mocha";
import UserRoleString from "../../src/enum/UserRoleString";
import User from "../../src/models/User";
import { compareRoles } from "../../src/utils/UserHelpers";

import chai from "chai";

process.env.NODE_ENV = "test";
const should = chai.should();

let user: User;

describe("User model", () => {
  beforeEach(done => {
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
      password_hash: "12345",
      created: new Date(2017, 1, 1),
      modified: new Date(2017, 1, 1),
      tktl: 1,
      deleted: 0,
      hy_staff: 1,
      hy_student: 0,
    });
    done();
  });

  it("Sets data correctly", done => {
    user.id.should.equal(1);
    user.username.should.equal("testuser");
    user.name.should.equal("Test User");
    user.screenName.should.equal("testuser");
    user.email.should.equal("user@test.com");
    user.residence.should.equal("helsinki");
    user.phone.should.equal("12345");
    user.isHYYMember.should.equal(true);
    user.isHyStaff.should.equal(true);
    user.isHyStudent.should.equal(false);
    user.membership.should.equal("member");
    user.role.should.equal("yllapitaja");
    user.salt.should.equal("12345");
    user.hashedPassword.should.equal("12345");
    user.passwordHash.should.equal("12345");
    user.createdAt.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    user.modifiedAt.toDateString().should.equal(new Date(2017, 1, 1).toDateString());
    user.isTKTL.should.equal(true);
    user.isDeleted.should.equal(false);
    done();
  });

  it("Removing sensitive data should remove salt and hashed_password", done => {
    should.exist(user.hashedPassword);
    should.exist(user.passwordHash);
    should.exist(user.salt);
    const newUser = user.removeSensitiveInformation();
    should.not.exist(newUser.hashedPassword);
    should.not.exist(newUser.passwordHash);
    should.not.exist(newUser.salt);
    done();
  });

  it("Requesting database object should return correct information", done => {
    const userDatabaseObject = user.getDatabaseObject();

    // Username
    should.exist(userDatabaseObject.username);
    userDatabaseObject.username.should.equal("testuser");
    // TKTL
    should.exist(userDatabaseObject.tktl);
    userDatabaseObject.tktl.should.equal(1);
    // Screen name
    should.exist(userDatabaseObject.screen_name);
    userDatabaseObject.screen_name!.should.equal("testuser");
    // Salt
    should.exist(userDatabaseObject.salt);
    userDatabaseObject.salt.should.equal("12345");
    // Role
    should.exist(userDatabaseObject.role);
    userDatabaseObject.role.should.equal("yllapitaja");
    // Residence
    should.exist(userDatabaseObject.residence);
    userDatabaseObject.residence.should.equal("helsinki");
    // Phone
    should.exist(userDatabaseObject.phone);
    userDatabaseObject.phone.should.equal("12345");
    // Name
    should.exist(userDatabaseObject.name);
    userDatabaseObject.name.should.equal("Test User");
    // Membership
    should.exist(userDatabaseObject.membership);
    userDatabaseObject.membership.should.equal("member");
    // ID
    should.exist(userDatabaseObject.id);
    userDatabaseObject.id.should.equal(1);
    // HYY member
    should.exist(userDatabaseObject.hyy_member);
    userDatabaseObject.hyy_member.should.equal(1);
    // Hashed password
    should.exist(userDatabaseObject.hashed_password);
    userDatabaseObject.hashed_password.should.equal("12345");
    should.exist(userDatabaseObject.password_hash);
    userDatabaseObject.password_hash.should.equal("12345");
    // Email
    should.exist(userDatabaseObject.email);
    userDatabaseObject.email.should.equal("user@test.com");
    // Deleted
    should.exist(userDatabaseObject.deleted);
    userDatabaseObject.deleted.should.equal(0);
    // Created
    should.exist(userDatabaseObject.created);
    userDatabaseObject.created.toISOString().should.equal(new Date(2017, 1, 1).toISOString());
    // HY staff
    should.exist(userDatabaseObject.hy_staff);
    userDatabaseObject.hy_staff.should.equal(1);
    // HY student
    should.exist(userDatabaseObject.hy_student);
    userDatabaseObject.hy_student.should.equal(0);
    done();
  });

  it("Requesting only id should only return id", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 0));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only username should only return username", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 1));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only name should only return name", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 2));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only screenName should only return screenName", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 3));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only email should only return email", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 4));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only residence should only return residence", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 5));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only phone should only return phone", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 6));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only isHYYMember should only return isHYYMember", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 7));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only membership should only return membership", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 8));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it("Requesting only role should only return role", done => {
    const newUser = user.removeNonRequestedData(Math.pow(2, 9));
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
    should.not.exist(newUser.passwordHash);
    done();
  });

  it(
    "Requesting username, name, email and membership should" + " only return username, name, email and membership",
    done => {
      const newUser = user.removeNonRequestedData(Math.pow(2, 1) | Math.pow(2, 2) | Math.pow(2, 4) | Math.pow(2, 8));
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
      should.not.exist(newUser.passwordHash);
      done();
    },
  );

  describe("compareRoles()", () => {
    it("aN == bN should return 0", done => {
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

    it("aN < bN should return -1", done => {
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

    it("aN > bN should return 1", done => {
      const role1: UserRoleString = UserRoleString.Jasenvirkailija;
      const role2: UserRoleString = UserRoleString.Kayttaja;
      const roleCompare: number = compareRoles(role2, role1);

      roleCompare.should.equal(-1);

      done();
    });
  });
});

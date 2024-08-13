import { describe, test, beforeEach, expect } from "vitest";
import UserRoleString from "../../src/enum/UserRoleString";
import User, { removeNonRequestedData, removeSensitiveInformation } from "../../src/models/User";
import { compareRoles } from "../../src/utils/UserHelpers";

process.env.NODE_ENV = "test";

let user: User;

describe("User model", () => {
  beforeEach(() => {
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
      tktdt_student: 0,
    });
  });

  test("Sets data correctly", () => {
    expect(user.id).to.equal(1);
    expect(user.username).to.equal("testuser");
    expect(user.name).to.equal("Test User");
    expect(user.screenName).to.equal("testuser");
    expect(user.email).to.equal("user@test.com");
    expect(user.residence).to.equal("helsinki");
    expect(user.phone).to.equal("12345");
    expect(user.isHYYMember).to.equal(true);
    expect(user.isHyStaff).to.equal(true);
    expect(user.isHyStudent).to.equal(false);
    expect(user.membership).to.equal("member");
    expect(user.role).to.equal("yllapitaja");
    expect(user.salt).to.equal("12345");
    expect(user.hashedPassword).to.equal("12345");
    expect(user.passwordHash).to.equal("12345");
    expect(user.createdAt.toDateString()).to.equal(new Date(2017, 1, 1).toDateString());
    expect(user.modifiedAt.toDateString()).to.equal(new Date(2017, 1, 1).toDateString());
    expect(user.isTKTL).to.equal(true);
    expect(user.isDeleted).to.equal(false);
  });

  test("Removing sensitive data should remove salt and hashed_password", () => {
    expect(user).toHaveProperty("hashedPassword");
    expect(user).toHaveProperty("passwordHash");
    expect(user).toHaveProperty("salt");
    const newUser = removeSensitiveInformation(user);
    expect(newUser).not.toHaveProperty("hashedPassword");
    expect(newUser).not.toHaveProperty("passwordHash");
    expect(newUser).not.toHaveProperty("salt");
  });

  test("Requesting database object should return correct information", () => {
    const userDatabaseObject = user.getDatabaseObject();

    // Username
    expect(userDatabaseObject.username).toBeDefined();
    expect(userDatabaseObject.username).to.equal("testuser");
    // TKTL
    expect(userDatabaseObject.tktl).toBeDefined();
    expect(userDatabaseObject.tktl).to.equal(1);
    // Screen name
    expect(userDatabaseObject.screen_name).toBeDefined();
    expect(userDatabaseObject.screen_name!).to.equal("testuser");
    // Salt
    expect(userDatabaseObject.salt).toBeDefined();
    expect(userDatabaseObject.salt).to.equal("12345");
    // Role
    expect(userDatabaseObject.role).toBeDefined();
    expect(userDatabaseObject.role).to.equal("yllapitaja");
    // Residence
    expect(userDatabaseObject.residence).toBeDefined();
    expect(userDatabaseObject.residence).to.equal("helsinki");
    // Phone
    expect(userDatabaseObject.phone).toBeDefined();
    expect(userDatabaseObject.phone).to.equal("12345");
    // Name
    expect(userDatabaseObject.name).toBeDefined();
    expect(userDatabaseObject.name).to.equal("Test User");
    // Membership
    expect(userDatabaseObject.membership).toBeDefined();
    expect(userDatabaseObject.membership).to.equal("member");
    // ID
    expect(userDatabaseObject.id).toBeDefined();
    expect(userDatabaseObject.id).to.equal(1);
    // HYY member
    expect(userDatabaseObject.hyy_member).toBeDefined();
    expect(userDatabaseObject.hyy_member).to.equal(1);
    // Hashed password
    expect(userDatabaseObject.hashed_password).toBeDefined();
    expect(userDatabaseObject.hashed_password).to.equal("12345");
    expect(userDatabaseObject.password_hash).toBeDefined();
    expect(userDatabaseObject.password_hash).to.equal("12345");
    // Email
    expect(userDatabaseObject.email).toBeDefined();
    expect(userDatabaseObject.email).to.equal("user@test.com");
    // Deleted
    expect(userDatabaseObject.deleted).toBeDefined();
    expect(userDatabaseObject.deleted).to.equal(0);
    // Created
    expect(userDatabaseObject.created).toBeDefined();
    expect(userDatabaseObject.created.toISOString()).to.equal(new Date(2017, 1, 1).toISOString());
    // HY staff
    expect(userDatabaseObject.hy_staff).toBeDefined();
    expect(userDatabaseObject.hy_staff).to.equal(1);
    // HY student
    expect(userDatabaseObject.hy_student).toBeDefined();
    expect(userDatabaseObject.hy_student).to.equal(0);
    // TKTDT student
    expect(userDatabaseObject.tktdt_student).toBeDefined();
    expect(userDatabaseObject.tktdt_student).to.equal(0);
  });

  test("Requesting only id should only return id", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 0));
    expect(newUser.id).toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only username should only return username", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 1));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only name should only return name", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 2));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only screenName should only return screenName", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 3));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only email should only return email", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 4));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only residence should only return residence", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 5));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only phone should only return phone", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 6));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only isHYYMember should only return isHYYMember", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 7));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only membership should only return membership", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 8));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).toBeDefined();
    expect(newUser.role).not.toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test("Requesting only role should only return role", () => {
    const newUser = removeNonRequestedData(user, Math.pow(2, 9));
    expect(newUser.id).not.toBeDefined();
    expect(newUser.username).not.toBeDefined();
    expect(newUser.name).not.toBeDefined();
    expect(newUser.screenName).not.toBeDefined();
    expect(newUser.email).not.toBeDefined();
    expect(newUser.residence).not.toBeDefined();
    expect(newUser.phone).not.toBeDefined();
    expect(newUser.isHYYMember).not.toBeDefined();
    expect(newUser.membership).not.toBeDefined();
    expect(newUser.role).toBeDefined();
    expect(newUser.salt).not.toBeDefined();
    expect(newUser.hashedPassword).not.toBeDefined();
    expect(newUser.passwordHash).not.toBeDefined();
  });

  test(
    "Requesting username, name, email and membership should" + " only return username, name, email and membership",
    () => {
      const newUser = removeNonRequestedData(user, Math.pow(2, 1) | Math.pow(2, 2) | Math.pow(2, 4) | Math.pow(2, 8));
      expect(newUser.id).not.toBeDefined();
      expect(newUser.username).toBeDefined();
      expect(newUser.name).toBeDefined();
      expect(newUser.screenName).not.toBeDefined();
      expect(newUser.email).toBeDefined();
      expect(newUser.residence).not.toBeDefined();
      expect(newUser.phone).not.toBeDefined();
      expect(newUser.isHYYMember).not.toBeDefined();
      expect(newUser.membership).toBeDefined();
      expect(newUser.role).not.toBeDefined();
      expect(newUser.salt).not.toBeDefined();
      expect(newUser.hashedPassword).not.toBeDefined();
      expect(newUser.passwordHash).not.toBeDefined();
    },
  );

  describe("compareRoles()", () => {
    test("aN == bN should return 0", () => {
      let role1: UserRoleString = UserRoleString.Jasenvirkailija;
      let role2: UserRoleString = UserRoleString.Jasenvirkailija;
      let roleCompare: number = compareRoles(role1, role2);
      expect(roleCompare).to.equal(0);

      role1 = UserRoleString.Kayttaja;
      role2 = UserRoleString.Kayttaja;
      roleCompare = compareRoles(role1, role2);
      expect(roleCompare).to.equal(0);

      role1 = UserRoleString.Tenttiarkistovirkailija;
      role2 = UserRoleString.Tenttiarkistovirkailija;
      roleCompare = compareRoles(role1, role2);
      expect(roleCompare).to.equal(0);

      role1 = UserRoleString.Virkailija;
      role2 = UserRoleString.Virkailija;
      roleCompare = compareRoles(role1, role2);
      expect(roleCompare).to.equal(0);

      role1 = UserRoleString.Yllapitaja;
      role2 = UserRoleString.Yllapitaja;
      roleCompare = compareRoles(role1, role2);
      expect(roleCompare).to.equal(0);
    });

    test("aN < bN should return -1", () => {
      let role1: UserRoleString = UserRoleString.Jasenvirkailija;
      let role2: UserRoleString = UserRoleString.Kayttaja;
      let roleCompare: number = compareRoles(role1, role2);
      expect(roleCompare).to.equal(1);

      role1 = UserRoleString.Yllapitaja;
      role2 = UserRoleString.Virkailija;
      roleCompare = compareRoles(role1, role2);
      expect(roleCompare).to.equal(1);
    });

    test("aN > bN should return 1", () => {
      const role1: UserRoleString = UserRoleString.Jasenvirkailija;
      const role2: UserRoleString = UserRoleString.Kayttaja;
      const roleCompare: number = compareRoles(role2, role1);

      expect(roleCompare).to.equal(-1);
    });
  });
});

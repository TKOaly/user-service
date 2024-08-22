import { describe, test, beforeEach, afterEach, expect } from "vitest";
import UserService from "../../src/services/UserService";
import User from "../../src/models/User";
import NatsService from "../../src/services/NatsService";
import { knexInstance as knex } from "../../src/Db";
import ServiceError from "../../src/utils/ServiceError";
import { omit } from "lodash";

describe("UserService", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  beforeEach(async () => {
    const nats = await NatsService.get();
    await nats.reset();
    await UserService.restart();
  });

  // After each
  afterEach(async () => {
    await UserService.stop();
    await knex.migrate.rollback();
  });

  test("Should be possible to create an user", async () => {
    const user = new User({
      id: 0,
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
      last_seq: 0,
    });

    await UserService.createUser(user, "pass");
  });

  test("Created user should be fetchable", async () => {
    const user = new User({
      id: 0,
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
      last_seq: 0,
    });

    const id = await UserService.createUser(user, "pass");
    const created = await UserService.fetchUser(id);

    expect(user.username).to.equal(created.username);
    expect(user.name).to.equal(created.name);
    expect(user.screenName).to.equal(created.screenName);
    expect(user.email).to.equal(created.email);
    expect(user.residence).to.equal(created.residence);
    expect(user.phone).to.equal(created.phone);
    expect(user.isHYYMember).to.equal(created.isHYYMember);
    expect(user.isHyStaff).to.equal(created.isHyStaff);
    expect(user.isHyStudent).to.equal(created.isHyStudent);
    expect(user.role).to.equal(created.role);
    expect(user.membership).to.equal(created.membership);
    expect(user.isTKTL).to.equal(created.isTKTL);
    expect(user.isTKTDTStudent).to.equal(created.isTKTDTStudent);
  });

  test("Should not be possible to use the same username twice", async () => {
    const userDetails = {
      id: 0,
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
      last_seq: 0,
    } as const;

    const user = new User(userDetails);

    await UserService.createUser(user, "pass");

    let success = false;

    try {
      await UserService.createUser(new User({ ...userDetails, email: "user2@test.com" }), "pass");
      success = true;
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect(err.message).to.equal("Username already in use!");
    }

    expect(success).toBeFalsy();
  });

  test("Should not be possible to use the same username twice", async () => {
    const userDetails = {
      id: 0,
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
      last_seq: 0,
    } as const;

    const user = new User(userDetails);

    await UserService.createUser(user, "pass");

    let success = false;

    try {
      await UserService.createUser(new User({ ...userDetails, username: "testuser2" }), "pass");
      success = true;
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect(err.message).to.equal("Email address already in use!");
    }

    expect(success).toBeFalsy();
  });

  test("Should be possible to update user details", async () => {
    const user = new User({
      id: 0,
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
      last_seq: 0,
    });

    const id = await UserService.createUser(user, "pass");
    const created = await UserService.fetchUser(id);

    expect(user.username).to.equal(created.username);
    expect(user.name).to.equal(created.name);
    expect(user.screenName).to.equal(created.screenName);
    expect(user.email).to.equal(created.email);
    expect(user.residence).to.equal(created.residence);
    expect(user.phone).to.equal(created.phone);
    expect(user.isHYYMember).to.equal(created.isHYYMember);
    expect(user.isHyStaff).to.equal(created.isHyStaff);
    expect(user.isHyStudent).to.equal(created.isHyStudent);
    expect(user.role).to.equal(created.role);
    expect(user.membership).to.equal(created.membership);
    expect(user.isTKTL).to.equal(created.isTKTL);
    expect(user.isTKTDTStudent).to.equal(created.isTKTDTStudent);

    const updateData = {
      username: "testuserx",
      name: "Test Userx",
      screen_name: "testuserx",
      email: "user@testx.com",
      residence: "helsinkix",
      phone: "12345999",
      hyy_member: 0,
      membership: "non-member",
      role: "virjkailija",
      salt: "12345x",
      hashed_password: "12345x",
      password_hash: "12345x",
      created: new Date(2024, 1, 1),
      modified: new Date(2024, 1, 1),
      tktl: 0,
      deleted: 0,
      hy_staff: 0,
      hy_student: 1,
      tktdt_student: 1,
    } as const;

    await UserService.updateUser(id, updateData);

    const updated = await UserService.fetchUser(id);

    expect(updated.getDatabaseObject()).toMatchObject(omit(updateData, ["modified"]));
    expect(updated.getDatabaseObject().modified).not.to.equal(updateData.modified);
  });

  test("Should not be possible to change user's email to an email already in use", async () => {
    const user2 = new User({
      id: 0,
      username: "testuser2",
      name: "Test User",
      screen_name: "testuser",
      email: "user2@test.com",
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
      last_seq: 0,
    });

    await UserService.createUser(user2, "pass");

    const user = new User({
      id: 0,
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
      last_seq: 0,
    });

    const id = await UserService.createUser(user, "pass");

    const updateData = {
      email: "user2@test.com",
    } as const;

    let success = false;

    try {
      await UserService.updateUser(id, updateData);
      success = true;
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect(err.message).to.equal("Email already in use!");
    }

    expect(success).toBeFalsy();
  });

  test("Should not be possible to change user's username to an username already in use", async () => {
    const user2 = new User({
      id: 0,
      username: "testuser2",
      name: "Test User",
      screen_name: "testuser",
      email: "user2@test.com",
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
      last_seq: 0,
    });

    await UserService.createUser(user2, "pass");

    const user = new User({
      id: 0,
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
      last_seq: 0,
    });

    const id = await UserService.createUser(user, "pass");

    const updateData = {
      username: "testuser2",
    } as const;

    let success = false;

    try {
      await UserService.updateUser(id, updateData);
      success = true;
    } catch (err) {
      expect(err).toBeInstanceOf(ServiceError);
      expect(err.message).to.equal("Username already in use!");
    }

    expect(success).toBeFalsy();
  });
});

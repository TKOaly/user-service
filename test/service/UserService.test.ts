import "mocha";
import UserService from "../../src/services/UserService";
import { assert } from "chai";
import User from "../../src/models/User";
import NatsService from "../../src/services/NatsService";
import { knexInstance as knex } from "../../src/Db";
import ServiceError from "../../src/utils/ServiceError";
import _ from "lodash";

describe('UserService', () => {
  // Roll back
  beforeEach(async () => {
    console.log("ROLLBACK!");
    await knex.migrate.rollback();
    console.log("MIGRATE!");
    await knex.migrate.latest();
    console.log("SEED!");
    await knex.seed.run();
    console.log("DONE!");
  });

  beforeEach(async () => {
    const nats = await NatsService.get();
    await nats.reset();
    await UserService.restart();
  });

  // After each
  afterEach(done => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  it('Should be possible to create an user', async () => {
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

    await UserService.createUser(user, 'pass');
  });

  it('Created user should be fetchable', async () => {
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

    const id = await UserService.createUser(user, 'pass');
    const created = await UserService.fetchUser(id);

    assert.equal(user.username, created.username);
    assert.equal(user.name, created.name);
    assert.equal(user.screenName, created.screenName);
    assert.equal(user.email, created.email);
    assert.equal(user.residence, created.residence);
    assert.equal(user.phone, created.phone);
    assert.equal(user.isHYYMember, created.isHYYMember);
    assert.equal(user.isHyStaff, created.isHyStaff);
    assert.equal(user.isHyStudent, created.isHyStudent);
    assert.equal(user.role, created.role);
    assert.equal(user.membership, created.membership);
    assert.equal(user.isTKTL, created.isTKTL);
    assert.equal(user.isTKTDTStudent, created.isTKTDTStudent);
  });

  it('Should not be possible to use the same username twice', async () => {
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

    await UserService.createUser(user, 'pass');

    let success = false;

    try {
      await UserService.createUser(new User({ ...userDetails, email: 'user2@test.com' }), 'pass');
      success = true;
    } catch (err) {
      assert.instanceOf(err, ServiceError);
      assert.equal(err.message, 'Username already in use!');
    }

    assert.isFalse(success, 'Should not succeed!');
  });

  it('Should not be possible to use the same username twice', async () => {
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

    await UserService.createUser(user, 'pass');

    let success = false;

    try {
      await UserService.createUser(new User({ ...userDetails, username: 'testuser2' }), 'pass');
      success = true;
    } catch (err) {
      assert.instanceOf(err, ServiceError);
      assert.equal(err.message, 'Email address already in use!');
    }

    assert.isFalse(success, 'Should not succeed!');
  });

  it('Should be possible to update user details', async () => {
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

    const id = await UserService.createUser(user, 'pass');
    const created = await UserService.fetchUser(id);

    assert.equal(user.username, created.username);
    assert.equal(user.name, created.name);
    assert.equal(user.screenName, created.screenName);
    assert.equal(user.email, created.email);
    assert.equal(user.residence, created.residence);
    assert.equal(user.phone, created.phone);
    assert.equal(user.isHYYMember, created.isHYYMember);
    assert.equal(user.isHyStaff, created.isHyStaff);
    assert.equal(user.isHyStudent, created.isHyStudent);
    assert.equal(user.role, created.role);
    assert.equal(user.membership, created.membership);
    assert.equal(user.isTKTL, created.isTKTL);
    assert.equal(user.isTKTDTStudent, created.isTKTDTStudent);

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

    assert.hasAllKeys(_.omit(updated.getDatabaseObject(), ['id', 'last_seq']), updateData);
  });

  it('Should not be possible to change user\'s email to an email already in use', async () => {
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

    await UserService.createUser(user2, 'pass');

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

    const id = await UserService.createUser(user, 'pass');

    const updateData = {
      email: "user2@test.com",
    } as const;

    let success = false;

    try {
      await UserService.updateUser(id, updateData);
      success = true;
    } catch (err) {
      assert.instanceOf(err, ServiceError);
      assert.equal(err.message, 'Email address in use!');
    }

    assert.isFalse(success, 'Should not succeed!');
  });

  it('Should not be possible to change user\'s username to an username already in use', async () => {
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

    await UserService.createUser(user2, 'pass');

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

    const id = await UserService.createUser(user, 'pass');

    const updateData = {
      username: "testuser2"
    } as const;

    let success = false;

    try {
      await UserService.updateUser(id, updateData);
      success = true;
    } catch (err) {
      assert.instanceOf(err, ServiceError);
      assert.equal(err.message, 'Username already in use!');
    }

    assert.isFalse(success, 'Should not succeed!');
  });
});

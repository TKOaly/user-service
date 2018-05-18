import * as Knex from "knex";
import User from "../models/User";
import Dao from "./Dao";
import * as Promise from "bluebird";

/**
 * User dao.
 *
 * @export
 * @class UserDao
 * @implements {Dao<User>}
 */
export default class UserDao implements Dao<User> {
  /**
   * Creates an instance of UserDao.
   * @param {Knex} knex
   * @memberof UserDao
   */
  constructor(private readonly knex: Knex) {}

  findOne(id: number): Promise<User> {
    return this.knex("users")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Returns a user by its username
   *
   * @param {string} username Username
   * @returns {Promise<User>} User
   * @memberof UserDao
   */
  findByUsername(username: string): Promise<User> {
    return this.knex("users")
      .select()
      .where({ username })
      .first();
  }

  /**
   * Returns a single user who hasn't paid his/her bill.
   *
   * @param {number} id User id
   * @returns {Promise<User>} User
   * @memberof UserDao
   */
  findByUnpaidPayment(id: number): Promise<User> {
    return this.knex("users")
      .select(
        "users.id",
        "users.username",
        "users.name",
        "users.name",
        "users.screen_name",
        "users.email",
        "users.residence",
        "users.phone",
        "users.hyy_member",
        "users.membership",
        "users.role",
        "users.salt",
        "users.hashed_password",
        "users.created",
        "users.modified",
        "users.deleted"
      )
      .innerJoin("payments", "users.id", "payments.payer_id")
      .where("users.id", "=", id)
      .andWhere("payments.paid", null)
      .first();
  }

  /**
   * Returns all users who have not paid their bill.
   *
   * @returns {Promise<User[]>} List of users
   * @memberof UserDao
   */
  findAllByUnpaidPayment(): Promise<User[]> {
    return this.knex("users")
      .select(
        "users.id",
        "users.username",
        "users.name",
        "users.name",
        "users.screen_name",
        "users.email",
        "users.residence",
        "users.phone",
        "users.hyy_member",
        "users.membership",
        "users.role",
        "users.salt",
        "users.hashed_password",
        "users.created",
        "users.modified",
        "users.deleted"
      )
      .innerJoin("payments", "users.id", "payments.payer_id")
      .where("payments.paid", null);
  }


  findAll(): Promise<User[]> {
    return this.knex("users").select();
  }

  /**
   * Search the user table with the specified search term.
   *
   * @param {any} searchTerm Search term
   * @returns {Promise<User[]>} User
   * @memberof UserDao
   */
  findWhere(searchTerm): Promise<User[]> {
    return this.knex
      .select()
      .from("users")
      .where("username", "like", `%${searchTerm}%`)
      .orWhere("name", "like", `%${searchTerm}%`)
      .orWhere("screen_name", "like", `%${searchTerm}%`)
      .orWhere("email", "like", `%${searchTerm}%`);
  }

  remove(id: number): Promise<boolean> {
    return this.knex("users")
      .delete()
      .where({ id });
  }

  update(entityId: any, entity: User): Promise<boolean> {
    return this.knex("users")
      .update(entity.getDatabaseObject())
      .where({ id: entityId});
  }

  save(entity: User): Promise<number[]> {
    return this.knex("users").insert(entity.getDatabaseObject());
  }
}

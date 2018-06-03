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
  constructor(private readonly knex: Knex) { }

  /**
   * Finds a single user.
   *
   * @param {number} id User id
   * @returns {Promise<User>}
   * @memberof UserDao
   */
  findOne(id: number): Promise<User> {
    return this.knex("users")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a single user by its username
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
   * Finds a single user who hasn't paid his/her bill.
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
   * Finds all users who haven't paid their bill.
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

  /**
   * Finds all users.
   *
   * @returns {Promise<User[]>}
   * @memberof UserDao
   */
  findAll(fields?: string[], conditions?: string[]): Promise<User[]> {
    if (fields) {
      let queryString = fields.join('`, ');
      let query = this.knex('users').select(fields);

      if (queryString.indexOf('Payment.')) {
        query.innerJoin('payments', 'users.id', 'payments.payer_id');
      }

      if (conditions) {
        conditions.forEach((cond, i) => {
          query = query[i == 0 ? 'whereRaw' : 'andWhereRaw'](cond);
        });
      }
      console.log(query.toString());
      return query;
    }

    return this.knex("users").select();
  }

  /**
   * Search the user table with the specified search term.
   *
   * @param {string} searchTerm Search term
   * @returns {Promise<User[]>}
   * @memberof UserDao
   */
  findWhere(searchTerm: string): Promise<User[]> {
    return this.knex
      .select()
      .from("users")
      .where("username", "like", `%${searchTerm}%`)
      .orWhere("name", "like", `%${searchTerm}%`)
      .orWhere("screen_name", "like", `%${searchTerm}%`)
      .orWhere("email", "like", `%${searchTerm}%`);
  }

  /**
   * Removes a single user.
   *
   * Note: You need to remove payments of the user first.
   *
   * @param {number} id User id
   * @returns {Promise<boolean>}
   * @memberof UserDao
   */
  remove(id: number): Promise<boolean> {
    return this.knex("users")
      .delete()
      .where({ id });
  }

  /**
   * Updates a singler user.
   *
   * @param {number} entityId User id
   * @param {User} entity Entity
   * @returns {Promise<boolean>}
   * @memberof UserDao
   */
  update(entityId: number, entity: User): Promise<boolean> {
    return this.knex("users")
      .update(entity.getDatabaseObject())
      .where({ id: entityId });
  }

  /**
   * Saves a single user.
   *
   * @param {User} entity
   * @returns {Promise<number[]>}
   * @memberof UserDao
   */
  save(entity: User): Promise<number[]> {
    return this.knex("users").insert(entity.getDatabaseObject());
  }
}

import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import IUserDatabaseObject from "../interfaces/IUserDatabaseObject";

/**
 * User dao.
 *
 * @export
 * @class UserDao
 * @implements {Dao<User>}
 */
export default class UserDao implements IDao<IUserDatabaseObject> {
  /**
   * Creates an instance of UserDao.
   * @param {Knex} knex
   * @memberof UserDao
   */
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single user.
   *
   * @param {number} id User id
   * @returns {Promise<IUserDatabaseObject>}
   * @memberof UserDao
   */
  public findOne(id: number): Promise<IUserDatabaseObject> {
    return this.knex("users")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a single user by its username.
   *
   * @param {string} username Username
   * @returns {Promise<IUserDatabaseObject>} User
   * @memberof UserDao
   */
  public findByUsername(username: string): Promise<IUserDatabaseObject> {
    return this.knex("users")
      .select()
      .where({ username })
      .first();
  }

  /**
   * Finds a single user by its email address.
   *
   * @param {string} email Email address
   * @returns {Promise<IUserDatabaseObject>} User
   * @memberof UserDao
   */
  public findByEmail(email: string): Promise<IUserDatabaseObject> {
    return this.knex("users")
      .select()
      .where({ email })
      .first();
  }

  /**
   * Finds a single user who hasn't paid his/her bill.
   *
   * @param {number} id User id
   * @returns {Promise<IUserDatabaseObject>} User
   * @memberof UserDao
   */
  public findByUnpaidPayment(id: number): Promise<IUserDatabaseObject> {
    return this.knex("users")
      .select(
        "users.id",
        "users.username",
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
   * @returns {Promise<IUserDatabaseObject[]>} List of users
   * @memberof UserDao
   */
  public findAllByUnpaidPayment(): Promise<IUserDatabaseObject[]> {
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
   * @returns {Promise<IUserDatabaseObject[]>}
   * @memberof UserDao
   */
  public findAll(
    fields?: string[],
    conditions?: string[]
  ): Promise<IUserDatabaseObject[]> {
    if (fields) {
      const queryString: string = fields.join("`, ");
      let query: Knex.QueryBuilder = this.knex("users").select(fields);

      if (queryString.indexOf("Payment.")) {
        query.leftOuterJoin("payments", "users.id", "payments.payer_id");
      }

      if (conditions) {
        conditions.forEach((cond: string, i: number) => {
          query = query[i === 0 ? "whereRaw" : "andWhereRaw"](cond);
        });
      }
      // console.log(query.toString());
      return query as Promise<IUserDatabaseObject[]>;
    }

    return this.knex("users").select();
  }

  /**
   * Search the user table with the specified search term.
   *
   * @param {string} searchTerm Search term
   * @returns {Promise<IUserDatabaseObject[]>}
   * @memberof UserDao
   */
  public findWhere(searchTerm: string): Promise<IUserDatabaseObject[]> {
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
  public remove(id: number): Promise<boolean> {
    // First, delete consents
    return this.knex("privacy_policy_consent_data")
      .delete()
      .where({ user_id: id })
      .then<boolean>((result: boolean) => {
        return this.knex("users")
          .delete()
          .where({ id });
      });
  }

  /**
   * Updates a single user.
   *
   * @param {number} entityId User id
   * @param {IUserDatabaseObject} entity Entity
   * @returns {Promise<number[]>} Affected rows
   * @memberof UserDao
   */
  public update(
    entityId: number,
    entity: IUserDatabaseObject
  ): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return this.knex("users")
      .update(entity)
      .where({ id: entityId });
  }

  /**
   * Saves a single user.
   *
   * @param {IUserDatabaseObject} entity
   * @returns {Promise<number[]>} Inserted ID(s)
   * @memberof UserDao
   */
  public save(entity: IUserDatabaseObject): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();
    return this.knex("users").insert(entity);
  }
}

import Knex from "knex";
import Dao from "../interfaces/Dao";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";
import { knexInstance } from "../Db";

const tableName = "users";

class UserDao implements Dao<UserDatabaseObject> {
  public findOne(id: number): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByUsername(username: string): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .select()
        .where({ username })
        .first(),
    );
  }

  public findByEmail(email: string): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .select()
        .where({ email })
        .first(),
    );
  }

  /**
   * Finds a single user who hasn't paid his/her bill.
   */
  public findByUnpaidPayment(id: number): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .select(`${tableName}.*`)
        .innerJoin("payments", `${tableName}.id`, "payments.payer_id")
        .where(`${tableName}.id`, "=", id)
        .andWhere("payments.paid", null)
        .first(),
    );
  }

  /**
   * Finds all users who haven't paid their bill.
   */
  public findAllByUnpaidPayment(): PromiseLike<UserDatabaseObject[]> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>("users")
        .select(`${tableName}.*`)
        .innerJoin("payments", `${tableName}.id`, "payments.payer_id")
        .where("payments.paid", null),
    );
  }

  public findAll(fields?: string[], conditions?: string[]): PromiseLike<UserDatabaseObject[]> {
    const query: Knex.QueryBuilder =
      knexInstance<UserDatabaseObject>(tableName)
        .select(`${tableName}.*`)
        .leftOuterJoin(
          knexInstance.raw("payments on (" + tableName + ".id = payments.payer_id and payments.valid_until > now())"),
        );
    if (fields) {
      query.select(fields);
    }

    if (conditions) {
      conditions.forEach((cond: string, i: number) => {
        query[i === 0 ? "whereRaw" : "andWhereRaw"](cond);
      });
    }

    return Promise.resolve<UserDatabaseObject[]>(query);
  }

  /**
   * Search the user table with the specified search term.
   */
  public findWhere(searchTerm: string): PromiseLike<UserDatabaseObject[]> {
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .select()
        .where("username", "like", `%${searchTerm}%`)
        .orWhere("name", "like", `%${searchTerm}%`)
        .orWhere("screen_name", "like", `%${searchTerm}%`)
        .orWhere("email", "like", `%${searchTerm}%`),
    );
  }

  public remove(id: number): PromiseLike<number> {
    // First, delete consents
    return knexInstance<UserDatabaseObject>("privacy_policy_consent_data")
      .delete()
      .where({ user_id: id })
      .then(result => {
        return knexInstance<UserDatabaseObject>(tableName)
          .delete()
          .where({ id });
      });
  }

  public update(
    entityId: number,
    entity: Partial<
      Pick<
        UserDatabaseObject,
        | "username"
        | "name"
        | "screen_name"
        | "email"
        | "residence"
        | "phone"
        | "hyy_member"
        | "membership"
        | "role"
        | "salt"
        | "hashed_password"
        | "tktl"
        | "deleted"
      >
    >,
  ): PromiseLike<number> {
    const savedObj = {
      ...entity,
      modified: new Date(),
    };
    return Promise.resolve(
      knexInstance<UserDatabaseObject>(tableName)
        .update(savedObj)
        .where({ id: entityId }),
    );
  }

  public save(
    entity: Required<
      Pick<
        UserDatabaseObject,
        | "username"
        | "name"
        | "screen_name"
        | "email"
        | "residence"
        | "phone"
        | "hyy_member"
        | "membership"
        | "role"
        | "salt"
        | "hashed_password"
        | "tktl"
        | "deleted"
      >
    >,
  ): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(knexInstance<UserDatabaseObject>(tableName).insert(savedObj));
  }
}

export default new UserDao();

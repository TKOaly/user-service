import Knex from "knex";
import Dao from "../interfaces/Dao";
import UserDatabaseObject, { UserPaymentDatabaseObject } from "../interfaces/UserDatabaseObject";
import { knexInstance } from "../Db";

const tableName = "users";

class UserDao implements Dao<UserDatabaseObject> {
  public findOne(id: number): PromiseLike<Required<UserDatabaseObject>> {
    return Promise.resolve<UserDatabaseObject>(
      knexInstance(tableName)
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByUsername(username: string): PromiseLike<UserDatabaseObject> {
    return Promise.resolve<UserDatabaseObject>(
      knexInstance(tableName)
        .select()
        .where({ username })
        .first(),
    );
  }

  public findByEmail(email: string): PromiseLike<UserDatabaseObject> {
    return Promise.resolve<UserDatabaseObject>(
      knexInstance(tableName)
        .select()
        .where({ email })
        .first(),
    );
  }

  /**
   * Finds a single user who hasn't paid his/her bill.
   */
  public findByUnpaidPayment(id: number): PromiseLike<UserDatabaseObject> {
    return Promise.resolve<UserDatabaseObject>(
      knexInstance(tableName)
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
    return Promise.resolve<UserDatabaseObject[]>(
      knexInstance("users")
        .select(`${tableName}.*`)
        .innerJoin("payments", `${tableName}.id`, "payments.payer_id")
        .where("payments.paid", null),
    );
  }

  public findAll(fields?: string[], conditions?: string[]): PromiseLike<UserDatabaseObject[]> {
    if (fields) {
      const queryString: string = fields.join("`, ");
      const query: Knex.QueryBuilder = knexInstance(tableName).select(fields);

      if (queryString.indexOf("Payment.")) {
        query.leftOuterJoin(
          knexInstance.raw("payments on (" + tableName + ".id = payments.payer_id and payments.valid_until > now())"),
        );
      }

      if (conditions) {
        conditions.forEach((cond: string, i: number) => {
          query[i === 0 ? "whereRaw" : "andWhereRaw"](cond);
        });
      }
      // console.log(query.toString());
      return Promise.resolve<UserPaymentDatabaseObject[]>(query);
    }

    return Promise.resolve<UserDatabaseObject[]>(knexInstance(tableName).select());
  }

  /**
   * Search the user table with the specified search term.
   */
  public findWhere(searchTerm: string): PromiseLike<UserDatabaseObject[]> {
    return Promise.resolve(
      knexInstance
        .select()
        .from(tableName)
        .where("username", "like", `%${searchTerm}%`)
        .orWhere("name", "like", `%${searchTerm}%`)
        .orWhere("screen_name", "like", `%${searchTerm}%`)
        .orWhere("email", "like", `%${searchTerm}%`),
    );
  }

  public remove(id: number): PromiseLike<boolean> {
    // First, delete consents
    return knexInstance("privacy_policy_consent_data")
      .delete()
      .where({ user_id: id })
      .then<boolean>((result: boolean) => {
        return knexInstance(tableName)
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
      knexInstance(tableName)
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
    return Promise.resolve(knexInstance(tableName).insert(savedObj));
  }
}

export default new UserDao();

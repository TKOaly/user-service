import Promise from "bluebird";
import Knex from "knex";
import IDao from "../interfaces/IDao";
import IUserDatabaseObject, { IUserPaymentDatabaseObject } from "../interfaces/IUserDatabaseObject";
import { knexInstance } from "../Db";

class UserDao implements IDao<IUserDatabaseObject> {
  public findOne(id: number): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      knexInstance("users")
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByUsername(username: string): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      knexInstance("users")
        .select()
        .where({ username })
        .first(),
    );
  }

  public findByEmail(email: string): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      knexInstance("users")
        .select()
        .where({ email })
        .first(),
    );
  }

  /**
   * Finds a single user who hasn't paid his/her bill.
   */
  public findByUnpaidPayment(id: number): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      knexInstance("users")
        .select("users.*")
        .innerJoin("payments", "users.id", "payments.payer_id")
        .where("users.id", "=", id)
        .andWhere("payments.paid", null)
        .first(),
    );
  }

  /**
   * Finds all users who haven't paid their bill.
   */
  public findAllByUnpaidPayment(): Promise<IUserDatabaseObject[]> {
    return Promise.resolve(
      knexInstance("users")
        .select("users.*")
        .innerJoin("payments", "users.id", "payments.payer_id")
        .where("payments.paid", null),
    );
  }

  public findAll(fields?: string[], conditions?: string[]): Promise<IUserDatabaseObject[]> {
    if (fields) {
      const queryString: string = fields.join("`, ");
      const query: Knex.QueryBuilder = knexInstance("users").select(fields);

      if (queryString.indexOf("Payment.")) {
        query.leftOuterJoin(
          knexInstance.raw("payments on (users.id = payments.payer_id and payments.valid_until > now())"),
        );
      }

      if (conditions) {
        conditions.forEach((cond: string, i: number) => {
          query[i === 0 ? "whereRaw" : "andWhereRaw"](cond);
        });
      }
      // console.log(query.toString());
      return Promise.resolve(query) as Promise<IUserPaymentDatabaseObject[]>;
    }

    return Promise.resolve<IUserDatabaseObject[]>(knexInstance("users").select());
  }

  /**
   * Search the user table with the specified search term.
   */
  public findWhere(searchTerm: string): Promise<IUserDatabaseObject[]> {
    return Promise.resolve(
      knexInstance
        .select()
        .from("users")
        .where("username", "like", `%${searchTerm}%`)
        .orWhere("name", "like", `%${searchTerm}%`)
        .orWhere("screen_name", "like", `%${searchTerm}%`)
        .orWhere("email", "like", `%${searchTerm}%`),
    );
  }

  /**
   * Removes a single user.
   *
   * Note: You need to remove payments of the user first.
   */
  public remove(id: number): PromiseLike<boolean> {
    // First, delete consents
    return knexInstance("privacy_policy_consent_data")
      .delete()
      .where({ user_id: id })
      .then<boolean>((result: boolean) => {
        return knexInstance("users")
          .delete()
          .where({ id });
      });
  }

  public update(entityId: number, entity: IUserDatabaseObject): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      knexInstance("users")
        .update(entity)
        .where({ id: entityId }),
    );
  }

  public save(entity: IUserDatabaseObject): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();
    return Promise.resolve(knexInstance("users").insert(entity));
  }
}

export default new UserDao();

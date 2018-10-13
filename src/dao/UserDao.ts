import Promise from "bluebird";
import Knex from "knex";
import IDao from "../interfaces/IDao";
import IUserDatabaseObject, {
  IUserPaymentDatabaseObject
} from "../interfaces/IUserDatabaseObject";

export default class UserDao implements IDao<IUserDatabaseObject> {
  constructor(private readonly knex: Knex) { }

  /**
   * Finds a single user.
   *
   * @param id User id
   */
  public findOne(id: number): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      this.knex("users")
        .select()
        .where({ id })
        .first()
    );
  }

  /**
   * Finds a single user by its username.
   */
  public findByUsername(username: string): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      this.knex("users")
        .select()
        .where({ username })
        .first()
    );
  }

  /**
   * Finds a single user by its email address.
   */
  public findByEmail(email: string): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      this.knex("users")
        .select()
        .where({ email })
        .first()
    );
  }

  /**
   * Finds a single user who hasn't paid their bill.
   *
   * @param id User id
   */
  public findByUnpaidPayment(id: number): Promise<IUserDatabaseObject> {
    return Promise.resolve(
      this.knex("users")
        .select("users.*")
        .innerJoin("payments", "users.id", "payments.payer_id")
        .where("users.id", "=", id)
        .andWhere("payments.paid", null)
        .first()
    );
  }

  /**
   * Finds all users who haven't paid their bill.
   */
  public findAllByUnpaidPayment(): Promise<IUserDatabaseObject[]> {
    return Promise.resolve(
      this.knex("users")
        .select("users.*")
        .innerJoin("payments", "users.id", "payments.payer_id")
        .where("payments.paid", null)
    );
  }

  /**
   * Finds all users.
   */
  public findAll(
    fields?: string[],
    conditions?: string[]
  ): Promise<IUserDatabaseObject[]> {
    if (fields) {
      const queryString: string = fields.join("`, ");
      const query: Knex.QueryBuilder = this.knex("users").select(fields);

      if (queryString.indexOf("Payment.")) {
        query.leftOuterJoin(
          this.knex.raw(
            "payments on (users.id = payments.payer_id and payments.valid_until > now())"
          )
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

    return Promise.resolve<IUserDatabaseObject[]>(this.knex("users").select());
  }

  /**
   * Search the user table with the specified search term.
   *
   * @param searchTerm Search term
   */
  public findWhere(searchTerm: string): Promise<IUserDatabaseObject[]> {
    return Promise.resolve(
      this.knex
        .select()
        .from("users")
        .where("username", "like", `%${searchTerm}%`)
        .orWhere("name", "like", `%${searchTerm}%`)
        .orWhere("screen_name", "like", `%${searchTerm}%`)
        .orWhere("email", "like", `%${searchTerm}%`)
    );
  }

  /**
   * Removes a single user.
   *
   * Note: You need to remove payments of the user first.
   *
   * @param id User id
   */
  public remove(id: number): PromiseLike<boolean> {
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
   * @param entityId User id
   * @param entity Entity data to update
   * @returns Number of affected rows
   */
  public update(
    entityId: number,
    entity: IUserDatabaseObject
  ): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      this.knex("users")
        .update(entity)
        .where({ id: entityId })
    );
  }

  /**
   * Saves a single user.
   *
   * @returns Inserted ID(s)
   */
  public save(entity: IUserDatabaseObject): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();
    return Promise.resolve(this.knex("users").insert(entity));
  }
}

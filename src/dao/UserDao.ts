import { Knex } from "knex";
import Dao from "../interfaces/Dao";
import UserDatabaseObject, { UserPaymentDatabaseObject } from "../interfaces/UserDatabaseObject";
import { knexInstance } from "../Db";

const tableName = "users";

type UserSaveModel = Required<
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
    | "password_hash"
    | "tktl"
    | "deleted"
    | "hy_student"
    | "hy_staff"
    | "tktdt_student"
    | "last_seq"
    | "registration_ban_bypass_until"
  >
> &
  Partial<Pick<UserDatabaseObject, "id">>;

const isTransaction = (knex: Knex): knex is Knex.Transaction => !!knex.isTransaction;

export class UserDao implements Dao<UserDatabaseObject> {
  knex: Knex;

  constructor(knex?: Knex) {
    this.knex = knex ?? knexInstance;
  }

  public async withTransaction<T>(callback: (dao: UserDao) => Promise<T>): Promise<T> {
    let tsx;
    let nested;

    if (isTransaction(this.knex)) {
      nested = true;
      tsx = this.knex;
    } else {
      nested = false;
      tsx = await this.knex.transaction();
    }

    try {
      const dao = new UserDao(tsx);
      const result = await callback(dao);
      if (!nested) tsx.commit();
      return result;
    } catch (err) {
      tsx.rollback();
      throw err;
    }
  }

  public findOne(id: number): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(this.knex<UserDatabaseObject>(tableName).select().where({ id }).first());
  }

  public findByUsername(username: string): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(this.knex<UserDatabaseObject>(tableName).select().where({ username }).first());
  }

  public findByEmail(email: string): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(this.knex<UserDatabaseObject>(tableName).select().where({ email }).first());
  }

  /**
   * Finds a single user who hasn't paid his/her bill.
   */
  public findByUnpaidPayment(id: number): PromiseLike<UserDatabaseObject | undefined> {
    return Promise.resolve(
      this.knex<UserDatabaseObject>(tableName)
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
      this.knex<UserDatabaseObject>("users")
        .select(`${tableName}.*`)
        .innerJoin("payments", `${tableName}.id`, "payments.payer_id")
        .where("payments.paid", null),
    );
  }

  public findAll(fields?: string[], conditions?: string[]): PromiseLike<UserPaymentDatabaseObject[]> {
    const query: Knex.QueryBuilder = this.knex<UserDatabaseObject>(tableName)
      .max("payments.valid_until")
      .leftOuterJoin(
        this.knex.raw("payments on (" + tableName + ".id = payments.payer_id and payments.valid_until > now())"),
      )
      .groupBy("users.id")
      .orderBy("users.name");

    const paymentFields = [
      "payments.id as payment_id",
      "payments.confirmer_id as payment_confirmer_id",
      "payments.created as payment_created",
      "payments.reference_number as payment_reference_number",
      "payments.amount as payment_amount",
      "payments.valid_until as payment_valid_until",
      "payments.paid as payment_paid",
      "payments.payment_type as payment_type",
      "payments.membership_applied_for as payment_membership_applied_for",
    ];

    if (fields) {
      query.select(fields, ...paymentFields);
    } else {
      query.select(`${tableName}.*`, ...paymentFields);
    }

    /* query.leftOuterJoin(
      this.knex.raw("payments on (" + tableName + ".id = payments.payer_id and payments.valid_until > now())"),
    ); */

    if (conditions) {
      conditions.forEach((cond: string, i: number) => {
        query[i === 0 ? "whereRaw" : "andWhereRaw"](cond);
      });
    }

    return Promise.resolve<UserPaymentDatabaseObject[]>(query);
  }

  /**
   * Search the user table with the specified search term.
   */
  public findWhere(searchTerm: string): PromiseLike<UserDatabaseObject[]> {
    return Promise.resolve(
      this.knex<UserDatabaseObject>(tableName)
        .select()
        .where("username", "like", `%${searchTerm}%`)
        .orWhere("name", "like", `%${searchTerm}%`)
        .orWhere("screen_name", "like", `%${searchTerm}%`)
        .orWhere("email", "like", `%${searchTerm}%`),
    );
  }

  public remove(id: number): PromiseLike<number> {
    // First, delete consents
    return this.knex<UserDatabaseObject>("privacy_policy_consent_data")
      .delete()
      .where("user_id", id)
      .then(_result => {
        return this.knex<UserDatabaseObject>(tableName).delete().where({ id });
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
        | "password_hash"
        | "tktl"
        | "deleted"
        | "hy_student"
        | "hy_staff"
        | "tktdt_student"
        | "registration_ban_bypass_until"
        | "last_seq"
      >
    >,
  ): PromiseLike<number> {
    const savedObj = {
      ...entity,
      modified: new Date(),
    };
    return Promise.resolve(this.knex<UserDatabaseObject>(tableName).update(savedObj).where({ id: entityId }));
  }

  public async reserveId(id?: number) {
    if (id === undefined) {
      const [{ max }] = await this.knex("user_ids").max("id", { as: "max" });

      if (max !== null && max !== undefined) {
        id = max + 1;
      }
    }

    if (id === undefined) {
      id = 1;
    }

    await this.knex("user_ids").insert({ id });

    return id;
  }

  public async reserveEmail(email: string) {
    await this.knex("user_ids").insert({ email });
  }

  public async releaseEmail(email: string) {
    await this.knex("user_ids").delete().where({ email });
  }

  public async reserveUsername(username: string) {
    await this.knex("user_ids").insert({ username });
  }

  public async releaseUsername(username: string) {
    await this.knex("user_ids").delete().where({ username });
  }

  public save(entity: UserSaveModel): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(this.knex<UserDatabaseObject>(tableName).insert(savedObj));
  }
}

export default new UserDao();

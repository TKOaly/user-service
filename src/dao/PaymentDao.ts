import * as Knex from "knex";
import User from "../models/User";
import Dao from "./Dao";
import * as Promise from "bluebird";
import Payment from "../models/Payment";

/**
 * Payment dao.
 *
 * @export
 * @class PaymentDao
 * @implements {Dao<Payment>}
 */
export default class PaymentDao implements Dao<Payment> {
  /**
   * Creates an instance of PaymentDao.
   * @param {Knex} knex
   * @memberof PaymentDao
   */
  constructor(private readonly knex: Knex) {}

  findOne(id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ id })
      .first();
  }

  findByPayer(payer_id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ payer_id })
      .first();
  }

  findByConfirmer(confirmer_id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ confirmer_id })
      .first();
  }

  findAll(): Promise<Payment[]> {
    return this.knex("payments").select();
  }

  remove(id: number): Promise<boolean> {
    return this.knex("payments")
      .delete()
      .where({ id });
  }

  update(entity: Payment): Promise<boolean> {
    return this.knex("payments")
      .update(entity)
      .where({ id: entity.id });
  }

  save(entity: Payment): Promise<number[]> {
    return this.knex("payments").insert(entity);
  }
}

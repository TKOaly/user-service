import * as Knex from "knex";
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

  /**
   * Finds a single payment.
   *
   * @param {number} id Payment id
   * @returns {Promise<Payment>}
   * @memberof PaymentDao
   */
  findOne(id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a payment by payer.
   *
   * @param {number} payer_id
   * @returns {Promise<Payment>}
   * @memberof PaymentDao
   */
  findByPayer(payer_id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ payer_id })
      .first();
  }

  /**
   * Finds a payment by confirmer.
   *
   * @param {number} confirmer_id
   * @returns {Promise<Payment>}
   * @memberof PaymentDao
   */
  findByConfirmer(confirmer_id: number): Promise<Payment> {
    return this.knex("payments")
      .select()
      .where({ confirmer_id })
      .first();
  }

  /**
   * Finds all payments.
   *
   * @returns {Promise<Payment[]>}
   * @memberof PaymentDao
   */
  findAll(): Promise<Payment[]> {
    return this.knex("payments").select();
  }

  /**
   * Removes a payment.
   *
   * @param {number} id Payment id
   * @returns {Promise<boolean>}
   * @memberof PaymentDao
   */
  remove(id: number): Promise<boolean> {
    return this.knex("payments")
      .delete()
      .where({ id });
  }

  /**
   * Updates a paymemt.
   *
   * @param {Payment} entity Payment
   * @returns {Promise<boolean>}
   * @memberof PaymentDao
   */
  update(entity: Payment): Promise<boolean> {
    return this.knex("payments")
      .update(entity)
      .where({ id: entity.id });
  }

  /**
   * Saves a payment.
   *
   * @param {Payment} entity Payment
   * @returns {Promise<number[]>}
   * @memberof PaymentDao
   */
  save(entity: Payment): Promise<number[]> {
    return this.knex("payments").insert(entity);
  }
}

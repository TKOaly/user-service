import * as Promise from "bluebird";
import * as Knex from "knex";
import { IPayment } from "../models/Payment";
import IDao from "./IDao";

/**
 * Payment dao.
 *
 * @export
 * @class PaymentDao
 * @implements {Dao<IPayment>}
 */
export default class PaymentDao implements IDao<IPayment> {
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
   * @returns {Promise<IPayment>}
   * @memberof PaymentDao
   */
  public findOne(id: number): Promise<IPayment> {
    return this.knex("payments")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a payment by payer.
   *
   * @param {number} payer_id
   * @param {boolean} [validPayment] If set to true, only searches for valid payments
   * @returns {Promise<IPayment>}
   * @memberof PaymentDao
   */
  public findByPayer(
    payer_id: number,
    validPayment?: boolean
  ): Promise<IPayment> {
    let query: Knex.QueryInterface = this.knex("payments")
      .select()
      .where({ payer_id });

    if (validPayment === true) {
      query = query.andWhere("valid_until", ">=", this.knex.fn.now());
    }

    return query.first();
  }

  /**
   * Finds a payment by confirmer.
   *
   * @param {number} confirmer_id
   * @returns {Promise<IPayment>} Payment by confirmer.
   * @memberof PaymentDao
   */
  public findByConfirmer(confirmer_id: number): Promise<IPayment> {
    return this.knex("payments")
      .select()
      .where({ confirmer_id })
      .first();
  }

  /**
   * Finds all payments.
   *
   * @returns {Promise<IPayment[]>}
   * @memberof PaymentDao
   */
  public findAll(): Promise<IPayment[]> {
    return this.knex("payments").select();
  }

  /**
   * Removes a payment.
   *
   * @param {number} id Payment id
   * @returns {Promise<boolean>}
   * @memberof PaymentDao
   */
  public remove(id: number): Promise<boolean> {
    return this.knex("payments")
      .delete()
      .where({ id });
  }

  /**
   * Updates a paymemt.
   *
   * @param {IPayment} entity Payment
   * @returns {Promise<boolean>} True if update was successful.
   * @memberof PaymentDao
   */
  public update(entity: IPayment): Promise<boolean> {
    return this.knex("payments")
      .update(entity)
      .where({ id: entity.id });
  }

  /**
   * Saves a payment.
   *
   * @param {IPayment} entity Payment
   * @returns {Promise<number[]>} Inserted payment ID.
   * @memberof PaymentDao
   */
  public save(entity: IPayment): Promise<number[]> {
    return this.knex("payments").insert(entity);
  }

  /**
   * Finds payments by payment type.
   *
   * @private
   * @param {string} payment_type Payment type
   * @returns {Promise<IPayment[]>} List of payments
   * @memberof PaymentDao
   */
  public findPaymentsByPaymentType(payment_type: string): Promise<IPayment[]> {
    return this.knex("payments")
      .select()
      .where({ payment_type });
  }

  /**
   * Confirms a payment.
   *
   * @param {number} payment_id Payment ID
   * @param {number} confirmer_id Confirmer ID
   * @returns {Promise<boolean>} True if the update was successful.
   * @memberof PaymentDao
   */
  public confirmPayment(
    payment_id: number,
    confirmer_id: number
  ): Promise<boolean> {
    return this.knex("payments")
      .update({
        paid: this.knex.fn.now(),
        confirmer_id
      })
      .where({ id: payment_id });
  }

  /**
   * Marks a payment paid by cash.
   *
   * @param {number} payment_id Payment ID
   * @param {number} confirmer_id Confirmer ID
   * @param {string} payment_type Payment type
   * @returns {Promise<boolean>} True if the update was successful.
   * @memberof PaymentDao
   */
  public makePaid(
    payment_id: number,
    confirmer_id: number,
    payment_type: string
  ): Promise<boolean> {
    return this.knex("payments")
      .update({
        payment_type,
        paid: this.knex.fn.now(),
        confirmer_id
      })
      .where({ id: payment_id });
  }
}

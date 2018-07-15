import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import { IPayment, IPaymentListing } from "../models/Payment";

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
    return Promise.resolve(
      this.knex("payments")
        .select()
        .where({ id })
        .first()
    );
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

    return Promise.resolve(query.first());
  }

  /**
   * Finds a payment by confirmer.
   *
   * @param {number} confirmer_id
   * @returns {Promise<IPayment>} Payment by confirmer.
   * @memberof PaymentDao
   */
  public findByConfirmer(confirmer_id: number): Promise<IPayment> {
    return Promise.resolve(
      this.knex("payments")
        .select()
        .where({ confirmer_id })
        .first()
    );
  }

  /**
   * Finds all payments.
   *
   * @returns {Promise<IPayment[]>}
   * @memberof PaymentDao
   */
  public findAll(): Promise<IPayment[]> {
    return Promise.resolve(this.knex("payments").select());
  }

  /**
   * Removes a payment.
   *
   * @param {number} id Payment id
   * @returns {Promise<boolean>}
   * @memberof PaymentDao
   */
  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      this.knex("payments")
        .delete()
        .where({ id })
    );
  }

  /**
   * Updates a payment.
   *
   * @param {number} entityId Entity ID
   * @param {IPayment} entity Payment
   * @returns {Promise<number>} Affected rows.
   * @memberof PaymentDao
   */
  public update(entityId: number, entity: IPayment): Promise<number> {
    return Promise.resolve(
      this.knex("payments")
        .where({ id: entityId })
        .update(entity)
    );
  }

  /**
   * Saves a payment.
   *
   * @param {IPayment} entity Payment
   * @returns {Promise<number[]>} Inserted payment ID.
   * @memberof PaymentDao
   */
  public save(entity: IPayment): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    return Promise.resolve(this.knex("payments").insert(entity));
  }

  /**
   * Finds payments by payment type.
   *
   * @private
   * @param {string} payment_type Payment type
   * @returns {Promise<IPayment[]>} List of payments
   * @memberof PaymentDao
   */
  public findPaymentsByPaymentType(
    payment_type: string
  ): Promise<IPaymentListing[]> {
    return Promise.resolve(
      this.knex("payments")
        .select(
          "payments.*",
          "pu.name as payer_name",
          "cu.name as confirmer_name"
        )
        .leftJoin(this.knex.raw("users as pu on (payments.payer_id = pu.id)"))
        .leftJoin(
          this.knex.raw("users as cu on (payments.confirmer_id = cu.id)")
        )
        .where({ payment_type })
    );
  }

  /**
   * Finds unpaid payments
   *
   * @returns {Promise<IPayment[]>} List of payments
   * @memberof PaymentDao
   */
  public findUnpaid(): Promise<IPaymentListing[]> {
    const query: Knex.QueryBuilder = this.knex("payments")
      .select("payments.*", "users.name as payer_name")
      .leftJoin(this.knex.raw("users on (users.id = payments.payer_id)"))
      .where({ paid: null });
    console.log(query.toString());
    return Promise.resolve(query);
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
    return Promise.resolve(this.knex("payments")
      .update({
        paid: this.knex.fn.now(),
        confirmer_id
      })
      .where({ id: payment_id }));
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
    return Promise.resolve(this.knex("payments")
      .update({
        payment_type,
        paid: this.knex.fn.now(),
        confirmer_id
      })
      .where({ id: payment_id }));
  }

  /**
   * Delete payment
   *
   * @param {number} id Payment id
   * @memberof PaymentDao
   */
  public deletePayment(id: number): Promise<boolean> {
    return Promise.resolve(this.knex("payments")
      .where({ id })
      .del());
  }
}

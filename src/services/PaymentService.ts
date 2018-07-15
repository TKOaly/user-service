import PaymentDao from "../dao/PaymentDao";
import Payment, { IPayment, IPaymentListing } from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import ServiceError from "../utils/ServiceError";

enum PaymentType {
  BankPayment = "tilisiirto",
  CashPayment = "kateinen"
}

/**
 * Payment service.
 *
 * @export
 * @class PaymentService
 */
export default class PaymentService {
  /**
   * Creates an instance of PaymentService.
   * @param {UserDao} paymentDao PaymentDAO
   * @memberof PaymentService
   */
  constructor(private readonly paymentDao: PaymentDao) {}

  /**
   * Returns a single payment from the database.
   *
   * @param {number} paymentId Payment ID
   * @returns {Promise<Payment>} Single payment
   * @memberof PaymentService
   */
  public async fetchPayment(paymentId: number): Promise<Payment> {
    const result: IPayment = await this.paymentDao.findOne(paymentId);
    if (!result) {
      throw new ServiceError(404, "Not found");
    }

    return new Payment(result);
  }

  /**
   * Returns all payments.
   *
   * @returns {Promise<Payment[]>} All payments
   * @memberof PaymentService
   */
  public async fetchAllPayments(): Promise<Payment[]> {
    const results: IPayment[] = await this.paymentDao.findAll();
    return results.map((result: IPayment) => new Payment(result));
  }

  /**
   * Returns payments by payer.
   *
   * @param {number} payerId Payer ID
   * @returns {Promise<Payment>} Payment
   * @memberof PaymentService
   */
  public async fetchPaymentByPayer(payerId: number): Promise<Payment> {
    return new Payment(await this.paymentDao.findByPayer(payerId));
  }

  /**
   * Returns valid payment for user.
   *
   * @param {number} userId User ID
   * @returns {Promise<Payment>} Payment
   * @memberof PaymentService
   */
  public async fetchValidPaymentForUser(userId: number): Promise<Payment> {
    const result: IPayment = await this.paymentDao.findByPayer(userId, true);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }
    return new Payment(result);
  }

  /**
   * Returns all unpaid payments
   *
   * @returns {Promise<PaymentListing>} Payment
   * @memberof PaymentService
   */
  public async fetchUnpaidPayments(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findUnpaid();
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  /**
   * Creates a payment.
   *
   * @param {Payment} payment Payment
   * @returns {Promise<number>} Inserted payment ID(s)
   * @memberof PaymentService
   */
  public async createPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(payment as IPayment);
  }

  /**
   * Creates a bank payment.
   *
   * @param {Payment} payment Payment
   * @returns {Promise<number>} Inserted id
   * @memberof PaymentService
   */
  public async createBankPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.BankPayment
    }) as IPayment);
  }

  /**
   * Creates a cash payment.
   *
   * @param {Payment} payment Payment
   * @returns {Promise<number>} Inserted id
   * @memberof PaymentService
   */
  public async createCashPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.CashPayment
    }) as IPayment);
  }

  /**
   * Updates a payment.
   *
   * @param {number} paymentId Payment id
   * @param {Payment} updatedPayment Updated payment
   * @returns {Promise<IPayment>}
   * @memberof PaymentService
   */
  public async updatePayment(
    paymentId: number,
    updatedPayment: Payment
  ): Promise<number> {
    return this.paymentDao.update(paymentId, updatedPayment as IPayment);
  }

  /**
   * Finds payments that have been paid by cash.
   *
   * @returns {Promise<PaymentListing[]>} List of payments paid by cash.
   * @memberof PaymentService
   */
  public async findPaymentsPaidByCash(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findPaymentsByPaymentType(
      PaymentType.CashPayment
    );
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  /**
   * Finds payments that have been paid by bank transfer.
   *
   * @returns {Promise<PaymentListing[]>} List of payments paid by bank transfer.
   * @memberof PaymentService
   */
  public async findPaymentsPaidByBankTransfer(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findPaymentsByPaymentType(
      PaymentType.BankPayment
    );
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  /**
   * Delete payment
   *
   * @param {number} paymentId Payment id
   * @memberof PaymentService
   */
  public async deletePatyment(paymentId: number): Promise<void> {
    await this.paymentDao.deletePayment(paymentId);
  }

  /**
   * Marks a cash payment paid.
   *
   * @param {number} payment_id Payment ID
   * @param {number} confirmer_id Confirmer ID
   * @returns {Promise<boolean>} True if the operation succeeded.
   * @memberof PaymentService
   */
  public async makeCashPaid(
    payment_id: number,
    confirmer_id: number
  ): Promise<boolean> {
    const payment: IPayment = await this.paymentDao.findOne(payment_id);

    if (payment.paid) {
      throw new Error("Error marking cash payment as paid");
    }

    return this.paymentDao.makePaid(
      payment_id,
      confirmer_id,
      PaymentType.CashPayment
    );
  }

  /**
   * Marks a bank payment paid.
   *
   * @param {number} payment_id Payment ID
   * @param {number} confirmer_id Confirmer ID
   * @returns {Promise<boolean>} True if the operation succeeded.
   * @memberof PaymentService
   */
  public async makeBankPaid(
    payment_id: number,
    confirmer_id: number
  ): Promise<boolean> {
    const payment: IPayment = await this.paymentDao.findOne(payment_id);

    if (!payment) {
      throw new ServiceError(400, "Payment doesn't exsist");
    }

    if (payment.paid) {
      throw new ServiceError(
        400,
        "Error marking cash payment as paid. Payment has already been paid"
      );
    }

    return this.paymentDao.makePaid(
      payment_id,
      confirmer_id,
      PaymentType.BankPayment
    );
  }

  /**
   * Adds a cash payment.
   *
   * @param {number} payer_id Payer ID
   * @param {number} confirmer_id Confirmer ID
   * @param {number} seasons Number of seasons
   * @param {string} membership Membership
   * @returns {Promise<Payment>} Created payment
   * @memberof PaymentService
   */
  public async addCashPayment(
    payer_id: number,
    confirmer_id: number,
    seasons: number,
    membership: string
  ): Promise<Payment> {
    // TO DO
    return null;
  }
}

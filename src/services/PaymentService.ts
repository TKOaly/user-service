import ServiceError from "../utils/ServiceError";
import PaymentDao from "../dao/PaymentDao";
import Payment from "../models/Payment";

/**
 * Payment service.
 *
 * @export
 * @class PaymentService
 */
export default class PaymentService {
  /**
   * Creates an instance of PaymentService.
   * @param {UserDao} paymentDao
   * @memberof PaymentService
   */
  constructor(private readonly paymentDao: PaymentDao) {}

  /**
   * Returns a single payment from the database.
   *
   * @param {number} paymentId
   * @returns
   * @memberof PaymentService
   */
  async fetchPayment(paymentId: number): Promise<Payment> {
    let result: Payment = await this.paymentDao.findOne(paymentId);
    if (!result) {
      throw new ServiceError(404, "Not found");
    }

    return result;
  }

  /**
   * Returns all payments.
   *
   * @returns {Promise<Payment[]>}
   * @memberof PaymentService
   */
  async fetchAllPayments(): Promise<Payment[]> {
    return this.paymentDao.findAll();
  }

  /**
   * Creates a payment.
   *
   * @param {Payment} payment
   * @returns {Promise<number[]>}
   * @memberof PaymentService
   */
  async createPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(payment);
  }

  /**
   * Updates a payment.
   *
   * @param {number} paymentId
   * @param {Payment} updatedPayment
   * @returns {Promise<boolean>}
   * @memberof PaymentService
   */
  async updatePayment(
    paymentId: number,
    updatedPayment: Payment
  ): Promise<boolean> {
    return this.paymentDao.update(updatedPayment);
  }
}

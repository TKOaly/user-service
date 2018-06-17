import PaymentDao from "../dao/PaymentDao";
import Payment, { IPayment } from "../models/Payment";
import ServiceError from "../utils/ServiceError";

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
   * @returns {Promise<Payment[]>}
   * @memberof PaymentService
   */
  public async fetchAllPayments(): Promise<Payment[]> {
    const results: IPayment[] = await this.paymentDao.findAll();
    return results.map((result: IPayment) => new Payment(result));
  }

  public async fetchPaymentByPayer(payerId: number): Promise<Payment> {
    return new Payment(await this.paymentDao.findByPayer(payerId));
  }

  public async fetchValidPaymentForUser(userId: number): Promise<Payment> {
    const result = await this.paymentDao.findByPayer(userId, true);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }
    return new Payment(result);
  }

  /**
   * Creates a payment.
   *
   * @param {Payment} payment
   * @returns {Promise<number[]>}
   * @memberof PaymentService
   */
  public async createPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(payment as IPayment);
  }

  /**
   * Updates a payment.
   *
   * @param {number} paymentId
   * @param {Payment} updatedPayment
   * @returns {Promise<boolean>}
   * @memberof PaymentService
   */
  public async updatePayment(
    paymentId: number,
    updatedPayment: Payment
  ): Promise<boolean> {
    return this.paymentDao.update(updatedPayment as IPayment);
  }
}

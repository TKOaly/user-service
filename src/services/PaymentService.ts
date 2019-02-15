import PaymentDao from "../dao/PaymentDao";
import Payment, { IPayment, IPaymentListing } from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import ServiceError from "../utils/ServiceError";

enum PaymentType {
  BankPayment = "tilisiirto",
  CashPayment = "kateinen",
}

export default class PaymentService {
  constructor(private readonly paymentDao: PaymentDao) {}

  public async fetchPayment(paymentId: number): Promise<Payment> {
    const result: IPayment = await this.paymentDao.findOne(paymentId);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }

    return new Payment(result);
  }

  public async fetchAllPayments(): Promise<Payment[]> {
    const results: IPayment[] = await this.paymentDao.findAll();
    return results.map((result: IPayment) => new Payment(result));
  }

  public async fetchPaymentByPayer(payerId: number): Promise<Payment> {
    return new Payment(await this.paymentDao.findByPayer(payerId));
  }

  public async fetchValidPaymentForUser(userId: number): Promise<Payment> {
    const result: IPayment = await this.paymentDao.findByPayer(userId, true);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }
    return new Payment(result);
  }

  public async fetchUnpaidPayments(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findUnpaid();
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  public async createPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(payment as IPayment);
  }

  public async createBankPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.BankPayment,
    }) as IPayment);
  }

  public async createCashPayment(payment: Payment): Promise<number[]> {
    return this.paymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.CashPayment,
    }) as IPayment);
  }

  public async updatePayment(paymentId: number, updatedPayment: Payment): Promise<number> {
    return this.paymentDao.update(paymentId, updatedPayment as IPayment);
  }

  public async findPaymentsPaidByCash(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findPaymentsByPaymentType(PaymentType.CashPayment);
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  public async findPaymentsPaidByBankTransfer(): Promise<PaymentListing[]> {
    const results: IPaymentListing[] = await this.paymentDao.findPaymentsByPaymentType(PaymentType.BankPayment);
    return results.map((ent: IPaymentListing) => new PaymentListing(ent));
  }

  // TODO: Fix typo
  public async deletePatyment(paymentId: number): Promise<void> {
    await this.paymentDao.deletePayment(paymentId);
  }

  /**
   * Marks a cash payment paid.
   * TODO: Clarify naming?
   */
  public async makeCashPaid(payment_id: number, confirmer_id: number): Promise<boolean> {
    const payment: IPayment = await this.paymentDao.findOne(payment_id);

    if (payment.paid) {
      throw new Error("Error marking cash payment as paid");
    }

    return this.paymentDao.makePaid(payment_id, confirmer_id, PaymentType.CashPayment);
  }

  /**
   * Marks a bank payment paid.
   * TODO: Clarify naming?
   */
  public async makeBankPaid(payment_id: number, confirmer_id: number): Promise<boolean> {
    const payment: IPayment = await this.paymentDao.findOne(payment_id);

    if (!payment) {
      throw new ServiceError(400, "Payment doesn't exsist");
    }

    if (payment.paid) {
      throw new ServiceError(400, "Error marking cash payment as paid. Payment has already been paid");
    }

    return this.paymentDao.makePaid(payment_id, confirmer_id, PaymentType.BankPayment);
  }

  /**
   * Adds a cash payment.
   * TODO: Should this be `createCashPayment` instead?
   */
  public async addCashPayment(
    payer_id: number,
    confirmer_id: number,
    seasons: number,
    membership: string,
  ): Promise<Payment> {
    // TO DO
    return null;
  }
}

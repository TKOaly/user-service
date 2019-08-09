import PaymentDao from "../dao/PaymentDao";
import Payment, { IPayment } from "../models/Payment";
import { PaymentListing } from "../models/PaymentListing";
import ServiceError from "../utils/ServiceError";

enum PaymentType {
  BankPayment = "tilisiirto",
  CashPayment = "kateinen",
}

class PaymentService {
  public async fetchPayment(paymentId: number): Promise<Payment> {
    const result = await PaymentDao.findOne(paymentId);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }

    return new Payment(result);
  }

  public async fetchAllPayments(): Promise<Payment[]> {
    const results = await PaymentDao.findAll();
    return results.map(result => new Payment(result));
  }

  public async fetchPaymentByPayer(payerId: number): Promise<Payment> {
    return new Payment(await PaymentDao.findByPayer(payerId));
  }

  public async fetchValidPaymentForUser(userId: number): Promise<Payment> {
    const result: IPayment = await PaymentDao.findByPayer(userId, true);
    if (!result) {
      throw new ServiceError(404, "Payment not found");
    }
    return new Payment(result);
  }

  public async fetchUnpaidPayments(): Promise<PaymentListing[]> {
    const results = await PaymentDao.findUnpaid();
    return results.map(ent => new PaymentListing(ent));
  }

  public async createPayment(payment: Payment): Promise<number[]> {
    return PaymentDao.save(payment as IPayment);
  }

  public async createBankPayment(payment: Payment): Promise<number[]> {
    return PaymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.BankPayment,
    }) as IPayment);
  }

  public async createCashPayment(payment: Payment): Promise<number[]> {
    return PaymentDao.save(Object.assign({}, payment, {
      payment_type: PaymentType.CashPayment,
    }) as IPayment);
  }

  public async updatePayment(paymentId: number, updatedPayment: Payment): Promise<number> {
    return PaymentDao.update(paymentId, updatedPayment as IPayment);
  }

  public async findPaymentsPaidByCash(): Promise<PaymentListing[]> {
    const results = await PaymentDao.findPaymentsByPaymentType(PaymentType.CashPayment);
    return results.map(ent => new PaymentListing(ent));
  }

  public async findPaymentsPaidByBankTransfer(): Promise<PaymentListing[]> {
    const results = await PaymentDao.findPaymentsByPaymentType(PaymentType.BankPayment);
    return results.map(ent => new PaymentListing(ent));
  }

  // TODO: Fix typo
  public async deletePatyment(paymentId: number): Promise<void> {
    await PaymentDao.deletePayment(paymentId);
  }

  /**
   * Marks a cash payment paid.
   * TODO: Clarify naming?
   */
  public async makeCashPaid(payment_id: number, confirmer_id: number): Promise<boolean> {
    const payment = await PaymentDao.findOne(payment_id);

    if (payment.paid) {
      throw new Error("Error marking cash payment as paid");
    }

    return PaymentDao.makePaid(payment_id, confirmer_id, PaymentType.CashPayment);
  }

  /**
   * Marks a bank payment paid.
   * TODO: Clarify naming?
   */
  public async makeBankPaid(payment_id: number, confirmer_id: number): Promise<boolean> {
    const payment = await PaymentDao.findOne(payment_id);

    if (!payment) {
      throw new ServiceError(400, "Payment doesn't exsist");
    }

    if (payment.paid) {
      throw new ServiceError(400, "Error marking cash payment as paid. Payment has already been paid");
    }

    return PaymentDao.makePaid(payment_id, confirmer_id, PaymentType.BankPayment);
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
    return Promise.resolve(new Payment({}));
  }
}

export default new PaymentService();

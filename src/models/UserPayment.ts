import { UserPaymentDatabaseObject } from "../interfaces/UserDatabaseObject";
import Payment from "./Payment";
import User from "./User";

export class UserPayment extends User {
  public payment: Payment;

  constructor(dbEnt: UserPaymentDatabaseObject) {
    super(dbEnt);

    this.payment = new Payment({
      id: dbEnt.payment_id,
      payer_id: dbEnt.id,
      confirmer_id: dbEnt.payment_confirmer_id,
      created: dbEnt.payment_created,
      reference_number: dbEnt.payment_reference_number,
      amount: dbEnt.payment_amount,
      valid_until: dbEnt.payment_valid_until,
      paid: dbEnt.payment_paid,
      payment_type: dbEnt.payment_type,
      membership_applied_for: dbEnt.payment_membership_applied_for,
    });
  }
}

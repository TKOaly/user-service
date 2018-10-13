import { IUserPaymentDatabaseObject } from "../interfaces/IUserDatabaseObject";
import User from "./User";

export class UserPayment extends User {
  /**
   * Date of payment
   */
  public paid: Date;
  /**
   * Date that the payment is valid until.
   */
  public valid_until: Date;

  constructor(dbEnt: IUserPaymentDatabaseObject) {
    super(dbEnt);
    this.paid = dbEnt.paid;
    this.valid_until = dbEnt.valid_until;
  }
}

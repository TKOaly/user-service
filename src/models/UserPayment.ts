import { IUserPaymentDatabaseObject } from "../interfaces/IUserDatabaseObject";
import User from "./User";
/**
 * User payment.
 *
 * @export
 * @class UserPayment
 * @extends {User}
 */
export class UserPayment extends User {
  /**
   * Paid date
   *
   * @type {Date}
   * @memberof UserPayment
   */
  public paid: Date;
  /**
   * Valid until date
   *
   * @type {Date}
   * @memberof UserPayment
   */
  public valid_until: Date;
  /**
   * Creates an instance of UserPayment.
   * @param {IUserPaymentDatabaseObject} dbEnt
   * @memberof UserPayment
   */
  constructor(dbEnt: IUserPaymentDatabaseObject) {
    super(dbEnt);
    this.paid = dbEnt.paid;
    this.valid_until = dbEnt.valid_until;
  }
}

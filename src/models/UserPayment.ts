import { IUserPaymentDatabaseObject } from "../interfaces/IUserDatabaseObject";
import User from "./User";

export class UserPayment extends User {
  public paid: Date;
  public valid_until: Date;

  constructor(dbEnt: IUserPaymentDatabaseObject) {
    super(dbEnt);
    this.paid = dbEnt.paid;
    this.valid_until = dbEnt.valid_until;
  }
}

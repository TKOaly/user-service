import { UserPaymentDatabaseObject } from "../interfaces/UserDatabaseObject";
import User from "./User";

export class UserPayment extends User {
  public paid: Date;
  public valid_until: Date;
  public membershipAppliedFor: string

  constructor(dbEnt: UserPaymentDatabaseObject) {
    super(dbEnt);
    this.paid = dbEnt.paid;
    this.valid_until = dbEnt.valid_until;
    this.membershipAppliedFor = dbEnt.membership_applied_for
  }
}

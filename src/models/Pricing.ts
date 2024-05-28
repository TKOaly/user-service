import { MembershipType } from "../enum/Membership";
import { PricingDatabaseObject } from "../interfaces/PricingDatabaseObject";

export default class Pricing {
  public id: number;
  public membership: MembershipType;
  public price: number;
  public seasons: number;
  public starts: Date;

  constructor(dbo: PricingDatabaseObject) {
    this.id = dbo.id;
    this.membership = dbo.membership;
    this.price = dbo.price;
    this.seasons = dbo.seasons;
    this.starts = dbo.starts;
  }
}

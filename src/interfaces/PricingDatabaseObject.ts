import { MembershipType } from "../enum/Membership";

export interface PricingDatabaseObject {
  id: number;
  membership: MembershipType;
  seasons: number;
  price: number;
  starts: Date;
}

import Payment, { PaymentListingDatabaseObject } from "./Payment";

export class PaymentListing extends Payment {
  public payerName: string;
  public confirmerName: string;

  constructor(dbEntity: PaymentListingDatabaseObject) {
    super(dbEntity);
    this.payerName = dbEntity.payer_name;
    this.confirmerName = dbEntity.confirmer_name;
  }
}

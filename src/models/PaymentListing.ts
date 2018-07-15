import Payment, { IPaymentListing } from "./Payment";
/**
 * Payment listing.
 *
 * @export
 * @class PaymentListing
 * @extends {Payment}
 */
export class PaymentListing extends Payment {
  /**
   * Payer name
   *
   * @type {string}
   * @memberof PaymentListing
   */
  public payerName: string;
  /**
   * Confirmer name
   *
   * @type {string}
   * @memberof PaymentListing
   */
  public confirmerName: string;
  constructor(dbEntity: IPaymentListing) {
    super(dbEntity);
    this.payerName = dbEntity.payer_name;
    this.confirmerName = dbEntity.confirmer_name;
  }
}

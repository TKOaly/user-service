export interface PaymentDatabaseObject {
  id: number;
  payer_id: number;
  confirmer_id: number;
  created: Date;
  reference_number: string;
  amount: number;
  valid_until: Date;
  paid: Date;
  payment_type: string;
  membership_applied_for: string;
}

export default class Payment {
  public id: number;
  public payer_id: number;
  public confirmer_id: number;
  public created: Date;
  public reference_number: string;
  public amount: number;
  public valid_until: Date;
  public paid: Date;
  public payment_type: string;
  public membership_applied_for: string;

  constructor(payment: PaymentDatabaseObject) {
    this.id = payment.id;
    this.payer_id = payment.payer_id;
    this.confirmer_id = payment.confirmer_id;
    this.created = payment.created;
    this.reference_number = payment.reference_number;
    this.amount = payment.amount;
    this.valid_until = payment.valid_until;
    this.paid = payment.paid;
    this.payment_type = payment.payment_type;
    this.membership_applied_for = payment.membership_applied_for;
  }

  public generateReferenceNumber() {
    const baseNumber = "10" + String(this.id);
    if (baseNumber.length < 3 || baseNumber.length > 19) {
      throw new Error("baseNumber too long or short");
    }

    const multipliers = [7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7, 3, 1, 7];
    let sum = 0;
    let j = 0;
    baseNumber
      .split("")
      .reverse()
      .forEach(c => {
        sum += Number(c) * multipliers[j++];
      });

    this.reference_number = baseNumber + String((10 - (sum % 10)) % 10);
  }
}

export interface PaymentListingDatabaseObject extends PaymentDatabaseObject {
  payer_name: string;
  confirmer_name: string;
}

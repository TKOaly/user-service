export interface IPayment {
  id?: number;
  payer_id?: number;
  confirmer_id?: number;
  created?: Date;
  reference_number?: string;
  amount?: number;
  valid_until?: Date;
  paid?: Date;
  payment_type?: string;
}

export default class Payment implements IPayment {
  public id: number;
  public payer_id: number;
  public confirmer_id: number;
  public created: Date;
  public reference_number: string;
  public amount: number;
  public valid_until: Date;
  public paid: Date;
  public payment_type: string;

  constructor(payment: IPayment) {
    Object.keys(payment).forEach((key: string) => {
      this[key] = payment[key];
    });
  }

  public generateReferenceNumber(): void {
    const baseNumber: string = "10" + String(this.id);
    if (baseNumber.length < 3 || baseNumber.length > 19) {
      throw new Error("baseNumber too long or short");
    }

    const multipliers: number[] = [
      7,
      3,
      1,
      7,
      3,
      1,
      7,
      3,
      1,
      7,
      3,
      1,
      7,
      3,
      1,
      7,
      3,
      1,
      7
    ];
    let sum: number = 0;
    let j: number = 0;
    baseNumber
      .split("")
      .reverse()
      .forEach((c, i) => {
        sum += Number(c) * multipliers[j++];
      });

    this.reference_number = baseNumber + String((10 - (sum % 10)) % 10);
  }
}

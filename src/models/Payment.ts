/**
 * IPayment interface.
 *
 * @export
 * @interface IPayment
 */
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

/**
 * Payment class.
 *
 * @export
 * @class Payment
 * @implements {IPayment}
 */
export default class Payment implements IPayment {
  /**
   * ID
   *
   * @type {number}
   * @memberof Payment
   */
  public id: number;
  /**
   * Payer ID
   *
   * @type {number}
   * @memberof Payment
   */
  public payer_id: number;
  /**
   * Confirmer ID
   *
   * @type {number}
   * @memberof Payment
   */
  public confirmer_id: number;
  /**
   * Creation date
   *
   * @type {Date}
   * @memberof Payment
   */
  public created: Date;
  /**
   * Reference number
   *
   * @type {string}
   * @memberof Payment
   */
  public reference_number: string;
  /**
   * Amount
   *
   * @type {number}
   * @memberof Payment
   */
  public amount: number;
  /**
   * Valid until -date
   *
   * @type {Date}
   * @memberof Payment
   */
  public valid_until: Date;
  /**
   * Paid date
   *
   * @type {Date}
   * @memberof Payment
   */
  public paid: Date;
  /**
   * Payment type
   *
   * @type {string}
   * @memberof Payment
   */
  public payment_type: string;

  /**
   * Creates an instance of Payment.
   * @param {IPayment} payment
   * @memberof Payment
   */
  constructor(payment: IPayment) {
    Object.keys(payment).forEach((key: keyof IPayment) => {
      this[key] = payment[key];
    });
  }

  /**
   * Generates a reference number.
   *
   * @memberof Payment
   */
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
      .forEach((c: string, i: number) => {
        sum += Number(c) * multipliers[j++];
      });

    this.reference_number = baseNumber + String((10 - (sum % 10)) % 10);
  }
}

export interface IPaymentListing extends IPayment {
  payer_name?: string;
  confirmer_name?: string;
}

export interface IPricing {
  id?: number;
  membership: string;
  seasons: number;
  price: number;
  starts: Date;
}

/**
 * Pricing model.
 *
 * @export
 * @class Pricing
 * @implements {IPricing}
 */
export default class Pricing implements IPricing {
  public id?: number;
  public membership: string;
  public seasons: number;
  public price: number;
  public starts: Date;

  /**
   * Pricing model.
   * @param {IPricing} pricing Pricing
   * @memberof Pricing
   */
  constructor(pricing: IPricing) {
    Object.keys(pricing).forEach((key: string) => {
      this[key] = pricing[key];
    });
  }
}

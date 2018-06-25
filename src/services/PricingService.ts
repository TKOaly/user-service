import PricingDao from "../dao/PricingDao";
import Pricing, { IPricing } from "../models/Pricing";
import IService from "./IService";

/**
 * Pricing service.
 *
 * @export
 * @class PricingService
 * @implements {IService<Pricing>}
 */
export default class PricingService implements IService<Pricing> {
  constructor(private readonly pricingDao: PricingDao) {}

  /**
   * Finds one pricing by ID.
   *
   * @param {number} id Pricing ID
   * @returns {Promise<Pricing>} Single pricing
   * @memberof PricingService
   */
  public async findOne(id: number): Promise<Pricing> {
    const pricing: IPricing = await this.pricingDao.findOne(id);

    return new Pricing(pricing);
  }

  /**
   * Finds all pricings.
   *
   * @returns {Promise<Pricing[]>} All pricings
   * @memberof PricingService
   */
  public async findAll(): Promise<Pricing[]> {
    const pricings: IPricing[] = await this.pricingDao.findAll();

    return pricings.map((pricing: IPricing) => new Pricing(pricing));
  }

  /**
   * Updates a pricing.
   *
   * @param {number} entity_id Pricing ID
   * @param {Pricing} entity Pricing
   * @returns {Promise<boolean>} True if the operation succeeds.
   * @memberof PricingService
   */
  public async update(entity_id: number, entity: Pricing): Promise<boolean> {
    const updated: boolean = await this.pricingDao.update(
      entity_id,
      entity as IPricing
    );

    return updated;
  }

  /**
   * Deletes a pricing.
   *
   * @param {number} entity_id Pricing id
   * @returns {Promise<boolean>} True if the operation succeeds.
   * @memberof PricingService
   */
  public async delete(entity_id: number): Promise<boolean> {
    return this.pricingDao.remove(entity_id);
  }

  /**
   * Creates a new pricing.
   *
   * @param {Pricing} entity Pricing
   * @returns {Promise<number[]>} Inserted ID.
   * @memberof PricingService
   */
  public async create(entity: Pricing): Promise<number[]> {
    return this.pricingDao.save(entity as IPricing);
  }
}

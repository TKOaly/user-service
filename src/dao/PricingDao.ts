import * as Promise from "bluebird";
import * as Knex from "knex";
import { IPricing } from "../models/Pricing";
import IDao from "./IDao";

// Table name
const tableName: string = "pricings";

/**
 * Pricing DAO.
 *
 * @export
 * @class PricingDao
 * @implements {IDao<IPricing>}
 */
export default class PricingDao implements IDao<IPricing> {
  /**
   * Creates an instance of PricingDao.
   * @param {Knex} knex
   * @memberof PricingDao
   */
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single pricing by ID.
   *
   * @param {number} id
   * @returns {Promise<IPricing>} Single pricing
   * @memberof PricingDao
   */
  public findOne(id: number): Promise<IPricing> {
    return this.knex(tableName).select()
      .where({ id })
      .first();
  }

  /**
   * Finds all pricings.
   *
   * @returns {Promise<IPricing[]>} All pricings
   * @memberof PricingDao
   */
  public findAll(): Promise<IPricing[]> {
    return this.knex(tableName).select();
  }

  /**
   * Removes a pricing.
   *
   * @param {number} id Pricing ID
   * @returns {Promise<boolean>} True if the operation succeeds.
   * @memberof PricingDao
   */
  public remove(id: number): Promise<boolean> {
    return this.knex(tableName).delete().where({id});
  }

  /**
   * Updates a pricing.
   *
   * @param {*} entityId Pricing ID
   * @param {IPricing} entity Pricing
   * @returns {Promise<boolean>} True if the operation succeeds.
   * @memberof PricingDao
   */
  public update(entityId: any, entity: IPricing): Promise<boolean> {
    return this.knex(tableName).update(entity).where({id: entityId});
  }

  /**
   * Saves a pricing.
   *
   * @param {IPricing} entity Pricing
   * @returns {Promise<number[]>} Inserted ID
   * @memberof PricingDao
   */
  public save(entity: IPricing): Promise<number[]> {
    return this.knex(tableName).insert(entity);
  }
}

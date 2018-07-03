import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import Service from "../models/Service";

/**
 * Service dao.
 *
 * @export
 * @class ServiceDao
 * @implements {Dao<Service>}
 */
export default class ServiceDao implements IDao<Service> {
  /**
   * Creates an instance of ServiceDao.
   * @param {Knex} knex
   * @memberof ServiceDao
   */
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single service.
   *
   * @param {number} id Service id
   * @returns {Promise<Service>}
   * @memberof ServiceDao
   */
  public findOne(id: number): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a service by its identifier.
   *
   * @param {string} service_identifier Service identifier
   * @returns {Promise<Service>}
   * @memberof ServiceDao
   */
  public findByIdentifier(service_identifier: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_identifier })
      .first();
  }

  /**
   * Finds a service by its name.
   *
   * @param {string} service_name Service name
   * @returns {Promise<Service>}
   * @memberof ServiceDao
   */
  public findByName(service_name: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_name })
      .first();
  }

  /**
   * Finds all services.
   *
   * @returns {Promise<Service[]>}
   * @memberof ServiceDao
   */
  public findAll(): Promise<Service[]> {
    return this.knex("services").select();
  }

  /**
   * Removes a single service.
   *
   * @param {number} id Service id
   * @returns {Promise<boolean>}
   * @memberof ServiceDao
   */
  public remove(id: number): Promise<boolean> {
    return this.knex("services")
      .delete()
      .where({ id });
  }

  /**
   * Updates a single service.
   *
   * @param {Service} entity Service
   * @returns {Promise<boolean>}
   * @memberof ServiceDao
   */
  public update(entity: Service): Promise<boolean> {
    return this.knex("services")
      .update(entity)
      .where({ id: entity.id });
  }

  /**
   * Saves a new service.
   *
   * @param {Service} entity Service
   * @returns {Promise<number[]>}
   * @memberof ServiceDao
   */
  public save(entity: Service): Promise<number[]> {
    return this.knex("services").insert(entity);
  }
}

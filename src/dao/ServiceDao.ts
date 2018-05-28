import * as Knex from "knex";
import Service from "../models/Service";
import Dao from "./Dao";
import * as Promise from "bluebird";

/**
 * Service dao.
 *
 * @export
 * @class ServiceDao
 * @implements {Dao<Service>}
 */
export default class ServiceDao implements Dao<Service> {
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
  findOne(id: number): Promise<Service> {
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
  findByIdentifier(service_identifier: string): Promise<Service> {
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
  findByName(service_name: string): Promise<Service> {
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
  findAll(): Promise<Service[]> {
    return this.knex("services").select();
  }

  /**
   * Removes a single service.
   *
   * @param {number} id Service id
   * @returns {Promise<boolean>}
   * @memberof ServiceDao
   */
  remove(id: number): Promise<boolean> {
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
  update(entity: Service): Promise<boolean> {
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
  save(entity: Service): Promise<number[]> {
    return this.knex("services").insert(entity);
  }
}

import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import { IServiceDatabaseObject } from "../models/Service";

/**
 * Service dao.
 *
 * @export
 * @class ServiceDao
 * @implements {Dao<IServiceDatabaseObject>}
 */
export default class ServiceDao implements IDao<IServiceDatabaseObject> {
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
   * @returns {Promise<IServiceDatabaseObject>}
   * @memberof ServiceDao
   */
  public findOne(id: number): Promise<IServiceDatabaseObject> {
    return this.knex("services")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a service by its identifier.
   *
   * @param {string} service_identifier Service identifier
   * @returns {Promise<IServiceDatabaseObject>}
   * @memberof ServiceDao
   */
  public findByIdentifier(
    service_identifier: string
  ): Promise<IServiceDatabaseObject> {
    return this.knex("services")
      .select()
      .where({ service_identifier })
      .first();
  }

  /**
   * Finds a service by its name.
   *
   * @param {string} service_name Service name
   * @returns {Promise<IServiceDatabaseObject>}
   * @memberof ServiceDao
   */
  public findByName(service_name: string): Promise<IServiceDatabaseObject> {
    return this.knex("services")
      .select()
      .where({ service_name })
      .first();
  }

  /**
   * Finds all services.
   *
   * @returns {Promise<IServiceDatabaseObject[]>}
   * @memberof ServiceDao
   */
  public findAll(): Promise<IServiceDatabaseObject[]> {
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
   * @param {IServiceDatabaseObject} entity Service
   * @returns {Promise<number[]>} Affected rows
   * @memberof ServiceDao
   */
  public update(
    entityId: number,
    entity: IServiceDatabaseObject
  ): Promise<number> {
    // Update modified timestamp. Prevent updating created timestamp.
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return this.knex("services")
      .where({ id: entityId })
      .update(entity);
  }

  /**
   * Saves a new service.
   *
   * @param {IServiceDatabaseObject} entity Service
   * @returns {Promise<number[]>} Inserted ID(s)
   * @memberof ServiceDao
   */
  public save(entity: IServiceDatabaseObject): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    // Set timestamps
    entity.created = new Date();
    entity.modified = new Date();
    return this.knex("services").insert(entity);
  }
}

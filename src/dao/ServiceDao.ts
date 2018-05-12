import * as Knex from "knex";
import Service from "../models/Service";
import Dao from "./Dao";
import * as Promise from "bluebird";

/**
 * ServiceDao.
 */
export default class ServiceDao implements Dao<Service> {
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single service.
   * @param id Service id
   */
  findOne(id: number): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a service by its identifier.
   * @param service_identifier Service identivier
   */
  findByIdentifier(service_identifier: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_identifier })
      .first();
  }
  /**
   * Finds a service by its name.
   * @param service_name Service name
   */
  findByName(service_name: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_name })
      .first();
  }

  /**
   * Finds all services.
   */
  findAll(): Promise<Service[]> {
    return this.knex("services").select();
  }

  /**
   * Removes a service.
   */
  remove(id: number): Promise<boolean> {
    return this.knex("services")
      .delete()
      .where({ id });
  }

  /**
   * Updates a service.
   * @param entity Service
   */
  update(entity: Service): Promise<boolean> {
    return this.knex("services")
      .update(entity)
      .where({ id: entity.id });
  }

  /**
   * Saves a service.
   * @param entity Service
   */
  save(entity: Service): Promise<number[]> {
    return this.knex("services").insert(entity);
  }
}

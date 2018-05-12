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

  findOne(id: number): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ id })
      .first();
  }

  findByIdentifier(service_identifier: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_identifier })
      .first();
  }

  findByName(service_name: string): Promise<Service> {
    return this.knex("services")
      .select()
      .where({ service_name })
      .first();
  }

  findAll(): Promise<Service[]> {
    return this.knex("services").select();
  }

  remove(id: number): Promise<boolean> {
    return this.knex("services")
      .delete()
      .where({ id });
  }

  update(entity: Service): Promise<boolean> {
    return this.knex("services")
      .update(entity)
      .where({ id: entity.id });
  }

  save(entity: Service): Promise<number[]> {
    return this.knex("services").insert(entity);
  }
}

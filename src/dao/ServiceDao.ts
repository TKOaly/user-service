import Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import { IServiceDatabaseObject } from "../models/Service";

export default class ServiceDao implements IDao<IServiceDatabaseObject> {
  constructor(private readonly knex: Knex) { }

  public findOne(id: number): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      this.knex("services")
        .select()
        .where({ id })
        .first()
    );
  }

  public findByIdentifier(
    service_identifier: string
  ): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      this.knex("services")
        .select()
        .where({ service_identifier })
        .first()
    );
  }

  public findByName(service_name: string): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      this.knex("services")
        .select()
        .where({ service_name })
        .first()
    );
  }

  public findAll(): Promise<IServiceDatabaseObject[]> {
    return Promise.resolve(this.knex("services").select());
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      this.knex("privacy_policy_consent_data")
        .delete()
        .where({ service_id: id })
        .then<boolean>((result: boolean) => {
          return this.knex("privacy_policies")
            .delete()
            .where({ service_id: id })
            .then<boolean>((result: boolean) => {
              return this.knex("services")
                .delete()
                .where({ id });
            });
        })
    );
  }

  public update(
    entityId: number,
    entity: IServiceDatabaseObject
  ): Promise<number> {
    // Update modified timestamp. Prevent updating created timestamp.
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      this.knex("services")
        .where({ id: entityId })
        .update(entity)
    );
  }

  public save(entity: IServiceDatabaseObject): Promise<number[]> {
    // Delete id because it's auto-assigned
    if (entity.id) {
      delete entity.id;
    }
    // Set timestamps
    entity.created = new Date();
    entity.modified = new Date();
    return Promise.resolve(this.knex("services").insert(entity));
  }
}

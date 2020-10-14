import Dao from "../interfaces/Dao";
import { ServiceDatabaseObject } from "../models/Service";
import { knexInstance } from "../Db";

const tableName = "services";

class ServiceDao implements Dao<ServiceDatabaseObject> {
  public findOne(id: number): PromiseLike<ServiceDatabaseObject | undefined> {
    return Promise.resolve(knexInstance<ServiceDatabaseObject>(tableName).select().where({ id }).first());
  }

  public findAll(): PromiseLike<Required<ServiceDatabaseObject>[]> {
    return Promise.resolve(knexInstance<ServiceDatabaseObject>(tableName).select());
  }

  public remove(id: number): PromiseLike<number> {
    return Promise.resolve(
      knexInstance<ServiceDatabaseObject>("privacy_policy_consent_data")
        .delete()
        .where("service_id", id)
        .then(_result => {
          return knexInstance<ServiceDatabaseObject>("privacy_policies")
            .delete()
            .where("service_id", id)
            .then(_result => {
              return knexInstance<ServiceDatabaseObject>(tableName).delete().where({ id });
            });
        }),
    );
  }

  public update(
    entityId: number,
    entity: Partial<
      Pick<
        ServiceDatabaseObject,
        "service_name" | "display_name" | "redirect_url" | "service_identifier" | "data_permissions"
      >
    >,
  ): PromiseLike<number> {
    const savedObj = {
      ...entity,
      modified: new Date(),
    };
    return Promise.resolve(knexInstance<ServiceDatabaseObject>(tableName).where({ id: entityId }).update(savedObj));
  }

  public save(
    entity: Required<
      Pick<
        ServiceDatabaseObject,
        "service_name" | "display_name" | "redirect_url" | "service_identifier" | "data_permissions"
      >
    >,
  ): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(knexInstance<ServiceDatabaseObject>(tableName).insert(savedObj));
  }

  public findByIdentifier(service_identifier: string): PromiseLike<ServiceDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<ServiceDatabaseObject>(tableName).select().where({ service_identifier }).first(),
    );
  }

  public findByName(service_name: string): PromiseLike<ServiceDatabaseObject | undefined> {
    return Promise.resolve(knexInstance<ServiceDatabaseObject>(tableName).select().where({ service_name }).first());
  }
}

export default new ServiceDao();

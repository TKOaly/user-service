import Promise from "bluebird";
import IDao from "../interfaces/IDao";
import { IServiceDatabaseObject } from "../models/Service";
import { knexInstance } from "../Db";

class ServiceDao implements IDao<IServiceDatabaseObject> {
  public findOne(id: number): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      knexInstance("services")
        .select()
        .where({ id })
        .first(),
    );
  }

  public findByIdentifier(service_identifier: string): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      knexInstance("services")
        .select()
        .where({ service_identifier })
        .first(),
    );
  }

  public findByName(service_name: string): Promise<IServiceDatabaseObject> {
    return Promise.resolve(
      knexInstance("services")
        .select()
        .where({ service_name })
        .first(),
    );
  }

  public findAll(): Promise<IServiceDatabaseObject[]> {
    return Promise.resolve(knexInstance("services").select());
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance("privacy_policy_consent_data")
        .delete()
        .where({ service_id: id })
        .then<boolean>((result: boolean) => {
          return knexInstance("privacy_policies")
            .delete()
            .where({ service_id: id })
            .then<boolean>((result: boolean) => {
              return knexInstance("services")
                .delete()
                .where({ id });
            });
        }),
    );
  }

  public update(entityId: number, entity: IServiceDatabaseObject): Promise<number> {
    // Update modified timestamp. Prevent updating created timestamp.
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      knexInstance("services")
        .where({ id: entityId })
        .update(entity),
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
    return Promise.resolve(knexInstance("services").insert(entity));
  }
}

export default new ServiceDao();

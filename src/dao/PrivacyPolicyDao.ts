import Promise from "bluebird";
import IDao from "../interfaces/IDao";
import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";
import { knexInstance } from "../Db";

const tableName = "privacy_policies";

class PrivacyPolicyDao implements IDao<IPrivacyPolicyDatabaseObject> {
  public findOne(id: number): Promise<IPrivacyPolicyDatabaseObject> {
    return Promise.resolve(
      knexInstance
        .select()
        .from(tableName)
        .where({ id })
        .first(),
    );
  }

  /**
   * Finds privacy policy for a service, by the service's identifier.
   */
  public findByServiceIdentifier(serviceIdentifier: string): Promise<IPrivacyPolicyDatabaseObject> {
    return Promise.resolve(
      knexInstance
        .select(
          tableName + ".id",
          tableName + ".service_id",
          tableName + ".text",
          tableName + ".created",
          tableName + ".modified",
        )
        .from(tableName)
        .innerJoin("services", tableName + ".service_id", "services.id")
        .where("services.service_identifier", serviceIdentifier)
        .first(),
    );
  }

  public findByName(name: string): Promise<IPrivacyPolicyDatabaseObject> {
    return Promise.resolve(
      knexInstance
        .select()
        .from(tableName)
        .where({ name })
        .first(),
    );
  }

  public findAll(): Promise<IPrivacyPolicyDatabaseObject[]> {
    return Promise.resolve(knexInstance.select().from(tableName));
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance
        .delete()
        .from(tableName)
        .where({ id }),
    );
  }

  public update(entityId: number, entity: IPrivacyPolicyDatabaseObject): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      knexInstance(tableName)
        .update(entity)
        .where({ id: entityId }),
    );
  }

  public save(entity: IPrivacyPolicyDatabaseObject): Promise<number[]> {
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();

    return Promise.resolve(knexInstance(tableName).insert(entity));
  }
}

export default new PrivacyPolicyDao();

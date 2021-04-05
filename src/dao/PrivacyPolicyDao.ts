import Dao from "../interfaces/Dao";
import PrivacyPolicyDatabaseObject from "../interfaces/PrivacyPolicyDatabaseObject";
import { knexInstance } from "../Db";

const tableName = "privacy_policies";

class PrivacyPolicyDao implements Dao<PrivacyPolicyDatabaseObject> {
  public update(
    entityId: number,
    entity: Partial<Pick<PrivacyPolicyDatabaseObject, "service_id" | "text">>,
  ): PromiseLike<number> {
    const savedObj = {
      ...entity,
      modified: new Date(),
    };
    return Promise.resolve(
      knexInstance<PrivacyPolicyDatabaseObject>(tableName).update(savedObj).where({ id: entityId }),
    );
  }

  public save(entity: Required<Pick<PrivacyPolicyDatabaseObject, "service_id" | "text">>): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(knexInstance<PrivacyPolicyDatabaseObject>(tableName).insert(savedObj));
  }

  public findOne(id: number): PromiseLike<PrivacyPolicyDatabaseObject | undefined> {
    return Promise.resolve(knexInstance.select<PrivacyPolicyDatabaseObject>(tableName).where({ id }).first());
  }

  /**
   * Finds privacy policy for a service, by the service's identifier.
   */
  public findByServiceIdentifier(serviceIdentifier: string): PromiseLike<PrivacyPolicyDatabaseObject | undefined> {
    return Promise.resolve(
      knexInstance<PrivacyPolicyDatabaseObject>(tableName)
        .select(
          tableName + ".id",
          tableName + ".service_id",
          tableName + ".text",
          tableName + ".created",
          tableName + ".modified",
        )
        .innerJoin("services", tableName + ".service_id", "services.id")
        .where("services.service_identifier", serviceIdentifier)
        .first(),
    );
  }

  public findByName(name: string): PromiseLike<PrivacyPolicyDatabaseObject | undefined> {
    return Promise.resolve(knexInstance<PrivacyPolicyDatabaseObject>(tableName).select().where("name", name).first());
  }

  public findAll(): PromiseLike<PrivacyPolicyDatabaseObject[]> {
    return Promise.resolve(knexInstance<PrivacyPolicyDatabaseObject>(tableName).select());
  }

  public remove(id: number): PromiseLike<number> {
    return Promise.resolve(knexInstance<PrivacyPolicyDatabaseObject>(tableName).delete().where("id", id));
  }
}

export default new PrivacyPolicyDao();

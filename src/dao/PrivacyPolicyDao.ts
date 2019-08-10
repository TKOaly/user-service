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
      knexInstance(tableName)
        .update(savedObj)
        .where({ id: entityId }),
    );
  }
  public save(entity: Required<Pick<PrivacyPolicyDatabaseObject, "service_id" | "text">>): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(knexInstance(tableName).insert(savedObj));
  }
  public findOne(id: number): PromiseLike<PrivacyPolicyDatabaseObject> {
    return Promise.resolve<PrivacyPolicyDatabaseObject>(
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
  public findByServiceIdentifier(serviceIdentifier: string): PromiseLike<PrivacyPolicyDatabaseObject> {
    return Promise.resolve<PrivacyPolicyDatabaseObject>(
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

  public findByName(name: string): PromiseLike<PrivacyPolicyDatabaseObject> {
    return Promise.resolve<PrivacyPolicyDatabaseObject>(
      knexInstance
        .select()
        .from(tableName)
        .where({ name })
        .first(),
    );
  }

  public findAll(): PromiseLike<PrivacyPolicyDatabaseObject[]> {
    return Promise.resolve<PrivacyPolicyDatabaseObject[]>(knexInstance.select().from(tableName));
  }

  public remove(id: number): PromiseLike<boolean> {
    return Promise.resolve<boolean>(
      knexInstance
        .delete()
        .from(tableName)
        .where({ id }),
    );
  }
}

export default new PrivacyPolicyDao();

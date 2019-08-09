import Promise from "bluebird";
import IDao from "../interfaces/IDao";
import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";
import { knexInstance } from "../Db";

class PrivacyPolicyDao implements IDao<IPrivacyPolicyDatabaseObject> {
  public findOne(id: number): Promise<IPrivacyPolicyDatabaseObject> {
    return Promise.resolve(
      knexInstance
        .select()
        .from("privacy_policies")
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
          "privacy_policies.id",
          "privacy_policies.service_id",
          "privacy_policies.text",
          "privacy_policies.created",
          "privacy_policies.modified",
        )
        .from("privacy_policies")
        .innerJoin("services", "privacy_policies.service_id", "services.id")
        .where("services.service_identifier", serviceIdentifier)
        .first(),
    );
  }

  public findByName(name: string): Promise<IPrivacyPolicyDatabaseObject> {
    return Promise.resolve(
      knexInstance
        .select()
        .from("privacy_policies")
        .where({ name })
        .first(),
    );
  }

  public findAll(): Promise<IPrivacyPolicyDatabaseObject[]> {
    return Promise.resolve(knexInstance.select().from("privacy_policies"));
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance
        .delete()
        .from("privacy_policies")
        .where({ id }),
    );
  }

  public update(entityId: number, entity: IPrivacyPolicyDatabaseObject): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return Promise.resolve(
      knexInstance("privacy_policies")
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

    return Promise.resolve(knexInstance("privacy_policies").insert(entity));
  }
}

export default new PrivacyPolicyDao();

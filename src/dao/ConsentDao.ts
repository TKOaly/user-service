import Promise from "bluebird";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";
import IDao from "../interfaces/IDao";
import { knexInstance } from "../Db";

const tableName: string = "privacy_policy_consent_data";

class ConsentDao implements IDao<IConsentDatabaseObject> {
  public findOne(id: number): Promise<IConsentDatabaseObject> {
    return Promise.resolve(
      knexInstance(tableName)
        .where({ id })
        .first(),
    );
  }

  public findAll(): Promise<IConsentDatabaseObject[]> {
    return Promise.resolve(knexInstance(tableName).select());
  }

  public remove(id: number): Promise<boolean> {
    return Promise.resolve(
      knexInstance(tableName)
        .delete()
        .where({ id }),
    );
  }

  public update(entityId: number, entity: IConsentDatabaseObject): Promise<number> {
    delete entity.created;
    entity.modified = new Date();
    return Promise.resolve(
      knexInstance(tableName)
        .update(entity)
        .where({ id: entityId }),
    );
  }

  /**
   * Resets privacy policy consent for all users that have accepted it, for a single service.
   */
  public resetAllAcceptedByService(service_id: number): Promise<number[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .update({ consent: PrivacyPolicyConsent.Unknown })
        .where({ consent: PrivacyPolicyConsent.Accepted, service_id }),
    );
  }

  public findAllByServiceId(service_id: number): Promise<IConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ service_id }),
    );
  }

  public findAllByUserId(user_id: number): Promise<IConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ user_id }),
    );
  }

  public findByUserAndService(user_id: number, service_id: number): Promise<IConsentDatabaseObject> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ user_id, service_id })
        .first(),
    );
  }

  public findAllDeclined(): Promise<IConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ consent: PrivacyPolicyConsent.Declined }),
    );
  }

  public save(entity: IConsentDatabaseObject): Promise<number[]> {
    entity.created = new Date();
    entity.modified = new Date();
    return Promise.resolve(knexInstance(tableName).insert(entity));
  }
}

export default new ConsentDao();

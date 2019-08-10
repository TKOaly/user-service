import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import ConsentDatabaseObject from "../interfaces/ConsentDatabaseObject";
import Dao from "../interfaces/Dao";
import { knexInstance } from "../Db";

const tableName = "privacy_policy_consent_data";

class ConsentDao implements Dao<ConsentDatabaseObject> {
  public update(
    entityId: number,
    entity: Partial<Pick<ConsentDatabaseObject, "user_id" | "service_id" | "consent">>,
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
  public save(
    entity: Required<Pick<ConsentDatabaseObject, "user_id" | "service_id" | "consent">>,
  ): PromiseLike<number[]> {
    const savedObj = {
      ...entity,
      created: new Date(),
      modified: new Date(),
    };
    return Promise.resolve(knexInstance(tableName).insert(savedObj));
  }

  public findOne(id: number): PromiseLike<ConsentDatabaseObject> {
    return Promise.resolve(
      knexInstance(tableName)
        .where({ id })
        .first(),
    );
  }

  public findAll(): PromiseLike<ConsentDatabaseObject[]> {
    return Promise.resolve(knexInstance(tableName).select());
  }

  public remove(id: number): PromiseLike<boolean> {
    return Promise.resolve(
      knexInstance(tableName)
        .delete()
        .where({ id }),
    );
  }

  /**
   * Resets privacy policy consent for all users that have accepted it, for a single service.
   */
  public resetAllAcceptedByService(service_id: number): PromiseLike<number[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .update({ consent: PrivacyPolicyConsent.Unknown })
        .where({ consent: PrivacyPolicyConsent.Accepted, service_id }),
    );
  }

  public findAllByServiceId(service_id: number): PromiseLike<ConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ service_id }),
    );
  }

  public findAllByUserId(user_id: number): PromiseLike<ConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ user_id }),
    );
  }

  public findByUserAndService(user_id: number, service_id: number): PromiseLike<ConsentDatabaseObject> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ user_id, service_id })
        .first(),
    );
  }

  public findAllDeclined(): PromiseLike<ConsentDatabaseObject[]> {
    return Promise.resolve(
      knexInstance(tableName)
        .select()
        .where({ consent: PrivacyPolicyConsent.Declined }),
    );
  }
}

export default new ConsentDao();

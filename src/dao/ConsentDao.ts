import * as Promise from "bluebird";
import * as Knex from "knex";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";
import IDao from "../interfaces/IDao";

const tableName: string = "privacy_policy_consent_data";

/**
 * Consent Dao.
 *
 * @export
 * @class ConsentDao
 * @implements {IDao<IConsentDatabaseObject>}
 */
export default class ConsentDao implements IDao<IConsentDatabaseObject> {
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single consent.
   *
   * @param {number} id Consent ID
   * @returns {Promise<IConsentDatabaseObject>} A single consent
   * @memberof ConsentDao
   */
  public findOne(id: number): Promise<IConsentDatabaseObject> {
    return this.knex(tableName)
      .where({ id })
      .first();
  }
  /**
   * Finds all consents.
   *
   * @returns {Promise<IConsentDatabaseObject[]>} All consents
   * @memberof ConsentDao
   */
  public findAll(): Promise<IConsentDatabaseObject[]> {
    return this.knex(tableName).select();
  }
  /**
   * Removes a consent.
   *
   * @param {number} id Consent id
   * @returns {Promise<boolean>}
   * @memberof ConsentDao
   */
  public remove(id: number): Promise<boolean> {
    return this.knex(tableName)
      .delete()
      .where({ id });
  }
  /**
   * Updates a consent.
   *
   * @param {number} entityId Consent ID
   * @param {IConsentDatabaseObject} entity Consent
   * @returns {Promise<number>}
   * @memberof ConsentDao
   */
  public update(
    entityId: number,
    entity: IConsentDatabaseObject
  ): Promise<number> {
    delete entity.created;
    entity.modified = new Date();
    return this.knex(tableName)
      .update(entity)
      .where({ id: entityId });
  }
  /**
   * Resets privacy policy consent for all users that have accepted it, for a single service.
   *
   * @returns {Promise<number[]>}
   * @memberof ConsentDao
   */
  public resetAllAcceptedByService(service_id: number): Promise<number[]> {
    return this.knex(tableName)
      .update({ consent: PrivacyPolicyConsent.Unknown })
      .where({ consent: PrivacyPolicyConsent.Accepted, service_id });
  }

  /**
   * Finds all consents by service.
   *
   * @param {number} service_id Service id
   * @returns {Promise<IConsentDatabaseObject[]>} Consents by service
   * @memberof ConsentDao
   */
  public findAllByServiceId(
    service_id: number
  ): Promise<IConsentDatabaseObject[]> {
    return this.knex(tableName)
      .select()
      .where({ service_id });
  }

  /**
   * Finds all consents by user.
   *
   * @param {number} service_id Service id
   * @returns {Promise<IConsentDatabaseObject[]>} Consents by service
   * @memberof ConsentDao
   */
  public findAllByUserId(user_id: number): Promise<IConsentDatabaseObject[]> {
    return this.knex(tableName)
      .select()
      .where({ user_id });
  }

  /**
   * Finds a consent by a user and a service.
   *
   * @param {number} user_id User ID
   * @param {number} service_id Service ID
   * @returns {Promise<IConsentDatabaseObject>}
   * @memberof ConsentDao
   */
  public findByUserAndService(
    user_id: number,
    service_id: number
  ): Promise<IConsentDatabaseObject> {
    return this.knex(tableName)
      .select()
      .where({ user_id, service_id })
      .first();
  }

  /**
   * Finds all declined consents.
   *
   * @returns {Promise<IConsentDatabaseObject[]>} Declined consents
   * @memberof ConsentDao
   */
  public findAllDeclined(): Promise<IConsentDatabaseObject[]> {
    return this.knex(tableName)
      .select()
      .where({ consent: PrivacyPolicyConsent.Declined });
  }

  /**
   * Saves a new consent.
   *
   * @param {IConsentDatabaseObject} entity Consent
   * @returns {Promise<number[]>}
   * @memberof ConsentDao
   */
  public save(entity: IConsentDatabaseObject): Promise<number[]> {
    entity.created = new Date();
    entity.modified = new Date();
    return this.knex(tableName).insert(entity);
  }
}

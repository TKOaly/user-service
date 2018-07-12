import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";

/**
 * Privacy policy Dao.
 *
 * @export
 * @class PrivacyPolicyDao
 * @implements {IDao<IPrivacyPolicyDatabaseObject>}
 */
export default class PrivacyPolicyDao
  implements IDao<IPrivacyPolicyDatabaseObject> {
  /**
   * Creates an instance of PrivacyPolicyDao.
   * @param {Knex} knex
   * @memberof PrivacyPolicyDao
   */
  constructor(private readonly knex: Knex) {}

  /**
   * Finds one privacy policy.
   *
   * @param {number} id
   * @returns {Promise<IPrivacyPolicyDatabaseObject>} Privacy policy
   * @memberof PrivacyPolicyDao
   */
  public findOne(id: number): Promise<IPrivacyPolicyDatabaseObject> {
    return this.knex
      .select()
      .from("privacy_policies")
      .where({ id })
      .first();
  }

  /**
   * Finds privacy policy for a service, by the service's identifier.
   *
   * @param {string} serviceIdentifier Service identifier
   * @returns {Promise<IPrivacyPolicyDatabaseObject>}
   * @memberof PrivacyPolicyDao
   */
  public findByServiceIdentifier(
    serviceIdentifier: string
  ): Promise<IPrivacyPolicyDatabaseObject> {
    return this.knex
      .select(
        "privacy_policies.id",
        "privacy_policies.service_id",
        "privacy_policies.text",
        "privacy_policies.created",
        "privacy_policies.modified"
      )
      .from("privacy_policies")
      .innerJoin("services", "privacy_policies.service_id", "services.id")
      .where("services.service_identifier", serviceIdentifier)
      .first();
  }

  /**
   * Finds a privacy policy by name.
   *
   * @param {string} name Privacy policy name
   * @returns {Promise<IPrivacyPolicyDatabaseObject>} Privacy policy
   * @memberof PrivacyPolicyDao
   */
  public findByName(name: string): Promise<IPrivacyPolicyDatabaseObject> {
    return this.knex
      .select()
      .from("privacy_policies")
      .where({ name })
      .first();
  }

  /**
   * Finds all privacy policies.
   *
   * @returns {Promise<IPrivacyPolicyDatabaseObject[]>} Privacy policies
   * @memberof PrivacyPolicyDao
   */
  public findAll(): Promise<IPrivacyPolicyDatabaseObject[]> {
    return this.knex.select().from("privacy_policies");
  }

  /**
   * Removes a privacy policy.
   *
   * @param {number} id Privacy policy id
   * @returns {Promise<boolean>}
   * @memberof PrivacyPolicyDao
   */
  public remove(id: number): Promise<boolean> {
    return this.knex
      .delete()
      .from("privacy_policies")
      .where({ id });
  }

  /**
   * Updates a privacy policy.
   *
   * @param {number} entityId Privacy policy id
   * @param {IPrivacyPolicyDatabaseObject} entity Privacy policy
   * @returns {Promise<number>}
   * @memberof PrivacyPolicyDao
   */
  public update(
    entityId: number,
    entity: IPrivacyPolicyDatabaseObject
  ): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return this.knex("privacy_policies")
      .update(entity)
      .where({ id: entityId });
  }

  /**
   * Saves a privacy policy.
   *
   * @param {IPrivacyPolicyDatabaseObject} entity Privacy policy
   * @returns {Promise<number[]>}
   * @memberof PrivacyPolicyDao
   */
  public save(entity: IPrivacyPolicyDatabaseObject): Promise<number[]> {
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();

    return this.knex("privacy_policies").insert(entity);
  }
}

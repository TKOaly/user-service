import * as Promise from "bluebird";
import * as Knex from "knex";
import IDao from "../interfaces/IDao";
import IPrivacyPolicy from "../interfaces/IPrivacyPolicy";

/**
 * Privacy policy Dao.
 *
 * @export
 * @class PrivacyPolicyDao
 * @implements {IDao<IPrivacyPolicy>}
 */
export default class PrivacyPolicyDao implements IDao<IPrivacyPolicy> {
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
   * @returns {Promise<IPrivacyPolicy>} Privacy policy
   * @memberof PrivacyPolicyDao
   */
  public findOne(id: number): Promise<IPrivacyPolicy> {
    return this.knex
      .select()
      .from("privacy_policy")
      .where({ id })
      .first();
  }

  /**
   * Finds a privacy policy by name.
   *
   * @param {string} name Privacy policy name
   * @returns {Promise<IPrivacyPolicy>} Privacy policy
   * @memberof PrivacyPolicyDao
   */
  public findByName(name: string): Promise<IPrivacyPolicy> {
    return this.knex
      .select()
      .from("privacy_policy")
      .where({ name })
      .first();
  }

  /**
   * Finds all privacy policies.
   *
   * @returns {Promise<IPrivacyPolicy[]>} Privacy policies
   * @memberof PrivacyPolicyDao
   */
  public findAll(): Promise<IPrivacyPolicy[]> {
    return this.knex.select().from("privacy_policy");
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
      .from("privacy_policy")
      .where({ id });
  }

  /**
   * Updates a privacy policy.
   *
   * @param {number} entityId Privacy policy id
   * @param {IPrivacyPolicy} entity Privacy policy
   * @returns {Promise<number>}
   * @memberof PrivacyPolicyDao
   */
  public update(entityId: number, entity: IPrivacyPolicy): Promise<number> {
    if (entity.created) {
      delete entity.created;
    }
    entity.modified = new Date();
    return this.knex("privacy_policy")
      .update(entity)
      .where({ id: entityId });
  }

  /**
   * Saves a privacy policy.
   *
   * @param {IPrivacyPolicy} entity Privacy policy
   * @returns {Promise<number[]>}
   * @memberof PrivacyPolicyDao
   */
  public save(entity: IPrivacyPolicy): Promise<number[]> {
    if (entity.id) {
      delete entity.id;
    }
    entity.created = new Date();
    entity.modified = new Date();

    return this.knex("privacy_policy").insert(entity);
  }
}

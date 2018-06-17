import * as Promise from "bluebird";

/**
 * Dao interface.
 *
 * @export
 * @interface Dao
 * @template T
 */
export default interface IDao<T> {
  /**
   * Returns an entity by its id.
   *
   * @param {number} id Entity id
   * @returns {Promise<T>} A single entity
   * @memberof Dao
   */
  findOne(id: number): Promise<T>;
  /**
   * Returns all entities.
   *
   * @returns {Promise<T[]>} All entities
   * @memberof Dao
   */
  findAll(): Promise<T[]>;
  /**
   * Removes an entity.
   *
   * @param {number} id Entity id
   * @returns {Promise<boolean>} Did the remove complete or not
   * @memberof Dao
   */
  remove(id: number): Promise<boolean>;
  /**
   * Updates an entity.
   *
   * @param {T} entity Entity
   * @returns {Promise<boolean>} Did the update complete or not
   * @memberof Dao
   */
  update(entityId: any, entity: T): Promise<boolean>;
  /**
   * Saves an entity.
   *
   * @param {T} entity
   * @returns {Promise<number[]>} Inserted id(s)
   * @memberof Dao
   */
  save(entity: T): Promise<number[]>;
}

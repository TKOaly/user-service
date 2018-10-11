import Promise from "bluebird";

/**
 * Dao interface.
 *
 * @export
 * @interface IDao
 * @template T
 */
export default interface IDao<T> {
  /**
   * Returns an entity by its id.
   *
   * @param {number} id Entity id
   * @returns {Promise<T>} A single entity
   * @memberof IDao
   */
  findOne(id: number): Promise<T>;
  /**
   * Returns all entities.
   *
   * @returns {Promise<T[]>} All entities
   * @memberof IDao
   */
  findAll(): Promise<T[]>;
  /**
   * Removes an entity.
   *
   * @param {number} id Entity id
   * @returns {Promise<boolean>} Did the remove complete or not
   * @memberof IDao
   */
  remove(id: number): Promise<boolean>;
  /**
   * Updates an entity.
   *
   * @param {T} entity Entity
   * @returns {Promise<number[]>} Affected row(s)
   * @memberof IDao
   */
  update(entityId: number, entity: T): Promise<number>;
  /**
   * Saves an entity.
   *
   * @param {T} entity
   * @returns {Promise<number[]>} Inserted id(s)
   * @memberof IDao
   */
  save(entity: T): Promise<number[]>;
}

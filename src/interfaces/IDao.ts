export default interface IDao<T> {
  /**
   * Returns an entity by its id.
   */
  findOne(id: number): PromiseLike<T>;
  /**
   * Returns all entities.
   */
  findAll(): PromiseLike<T[]>;
  /**
   * Removes an entity.
   */
  remove(id: number): PromiseLike<boolean>;
  /**
   * Updates an entity.
   */
  update(entityId: number, entity: T): PromiseLike<number>;
  /**
   * Saves an entity.
   */
  save(entity: T): PromiseLike<number[]>;
}

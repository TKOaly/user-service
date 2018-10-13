export default interface IDao<T> {
  /**
   * Returns an entity by its id.
   *
   * @param id Entity id
   */
  findOne(id: number): PromiseLike<T>;

  /**
   * Returns all entities.
   */
  findAll(): PromiseLike<T[]>;

  /**
   * Removes an entity.
   *
   * @param id Entity id
   */
  remove(id: number): PromiseLike<boolean>;

  /**
   * Updates an entity.
   *
   * @param entityId ID of the entity to update
   * @param entity Entity
   * @returns Number of affected row(s)
   */
  update(entityId: number, entity: T): PromiseLike<number>;
  /**
   * Saves an entity.
   *
   * @returns Inserted id(s)
   */
  save(entity: T): PromiseLike<number[]>;
}

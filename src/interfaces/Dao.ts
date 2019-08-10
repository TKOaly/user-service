export default interface Dao<T> {
  /**
   * Returns an entity by its id.
   */
  findOne(id: number): PromiseLike<Required<T>>;
  /**
   * Returns all entities.
   */
  findAll(): PromiseLike<Required<T>[]>;
  /**
   * Removes an entity.
   */
  remove(id: number): PromiseLike<boolean>;
  /**
   * Updates an entity.
   */
  update(entityId: number, entity: Partial<Omit<T, "created" | "modified" | "id">>): PromiseLike<number>;
  /**
   * Saves an entity.
   */
  save(entity: Required<Omit<T, "created" | "modified" | "id">>): PromiseLike<number[]>;
}

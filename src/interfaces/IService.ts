/**
 * Service interface. All services must implement this interface.
 */
export default interface IService<T> {
  findOne(id: number): Promise<T>;

  findAll(): Promise<T[]>;

  update(entity_id: number, entity: T): Promise<number>;

  delete(entity_id: number): Promise<boolean>;

  create(entity: T): Promise<number[]>;
}

/**
 * Service interface. All services must implement this interface.
 *
 * @export
 * @interface IService
 * @template T
 */
export default interface IService<T> {
  findOne(id: number): Promise<T>;

  findAll(): Promise<T[]>;

  update(entity_id: number, entity: T): Promise<boolean>;

  delete(entity_id: number): Promise<boolean>;

  create(entity: T): Promise<number[]>;
}

import * as Promise from "bluebird";

/**
 * Dao interface.
 */
export default interface Dao<T> {
  findOne(id: number): Promise<T>;
  findAll(): Promise<T[]>;
  remove(id: number): Promise<boolean>;
  update(entity: T): Promise<boolean>;
  save(entity: T): Promise<number[]>;
}

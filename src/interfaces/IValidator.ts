import User from "../models/User";

/**
 * IValidator interface.
 *
 * @export
 * @interface IValidator
 * @template T
 */
export default interface IValidator<T> {
  /**
   * Validates entity creation.
   *
   * @param {T} bodyData Entity
   * @memberof IValidator
   */
  validateCreate(bodyData: T): void;
  /**
   * Validates entity update.
   *
   * @param {number} dataId
   * @param {T} newData New data
   * @memberof IValidator
   */
  validateUpdate(dataId: number, newData: T, validator: User): void;
}

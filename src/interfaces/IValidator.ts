import User from "../models/User";

export default interface IValidator<T> {
  /**
   * Validates entity creation.
   *
   * @param bodyData Entity
   */
  validateCreate(bodyData: T): void;
  /**
   * Validates entity update.
   *
   * @param dataId ID of the existing record
   * @param newData New data
   */
  validateUpdate(dataId: number, newData: T, validator: User): void;
}

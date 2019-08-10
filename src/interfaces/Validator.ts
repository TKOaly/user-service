import User from "../models/User";

export default interface Validator<T, K> {
  /**
   * Validates entity creation.
   * TODO: Document how the actual validation occurs here
   */
  validateCreate(bodyData: T): void;
  /**
   * Validates entity update.
   * TODO: Document how the actual validation occurs here
   */
  validateUpdate(dataId: number, newData: K, validator: User): void;
}

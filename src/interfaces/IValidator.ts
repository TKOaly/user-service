import User from "../models/User";

export default interface IValidator<T> {
  /**
   * Validates entity creation.
   * TODO: Document how the actual validation occurs here
   */
  validateCreate(bodyData: T): void;
  /**
   * Validates entity update.
   * TODO: Document how the actual validation occurs here
   */
  validateUpdate(dataId: number, newData: T, validator: User): void;
}

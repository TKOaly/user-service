/**
 * User database object.
 *
 * @interface IUserDatabaseObject
 */
export default interface IUserDatabaseObject {
  id?: number;
  username?: string;
  name?: string;
  screen_name?: string;
  email?: string;
  residence?: string;
  phone?: string;
  hyy_member?: number | boolean;
  membership?: string;
  role?: string;
  salt?: string;
  hashed_password?: string;
  created?: Date;
  modified?: Date;
  tktl?: number | boolean;
  deleted?: number | boolean;
}

/**
 * User database object with additional payment information
 *
 * @interface IUserPaymentDatabaseObject
 */
export interface IUserPaymentDatabaseObject extends IUserDatabaseObject {
  paid?: Date;
  valid_until?: Date;
}

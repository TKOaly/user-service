export default interface UserDatabaseObject {
  id: number;
  username: string;
  name: string;
  screen_name: string;
  email: string;
  residence: string;
  phone: string;
  hyy_member: 0 | 1;
  membership: string;
  role: string;
  salt: string;
  hashed_password: string;
  created: Date;
  modified: Date;
  tktl: 0 | 1;
  deleted: 0 | 1;
  hy_staff: 0 | 1;
  hy_student: 0 | 1;
}

/**
 * User database object with additional payment information
 */
export interface UserPaymentDatabaseObject extends UserDatabaseObject {
  paid: Date;
  valid_until: Date;
  membership_applied_for: string;
}

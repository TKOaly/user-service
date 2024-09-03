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
  password_hash: string;
  created: Date;
  modified: Date;
  tktl: 0 | 1;
  deleted: 0 | 1;
  hy_staff: 0 | 1;
  hy_student: 0 | 1;
  tktdt_student: 0 | 1;
  registration_ban_bypass_until: Date | null;
  last_seq: number;
}

/**
 * User database object with additional payment information
 */
export interface UserPaymentDatabaseObject extends UserDatabaseObject {
  payment_id: number;
  payment_payer_id: number;
  payment_confirmer_id: number;
  payment_created: Date;
  payment_reference_number: string;
  payment_amount: number;
  payment_valid_until: Date;
  payment_paid: Date;
  payment_type: string;
  payment_membership_applied_for: string;
}

/**
 * Privacy policy interface.
 *
 * @export
 * @interface IPrivacyPolicy
 */
export default interface IPrivacyPolicyDatabaseObject {
  id?: number;
  service_id?: number;
  text?: string;
  modified?: Date;
  created?: Date;
}
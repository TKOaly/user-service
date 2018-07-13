import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";

/**
 * Privacy policy interface.
 *
 * @export
 * @interface IConsentDatabaseObject
 */
export default interface IConsentDatabaseObject {
  id?: number;
  user_id?: number;
  service_id?: number;
  consent?: PrivacyPolicyConsent;
  modified?: Date;
  created?: Date;
}

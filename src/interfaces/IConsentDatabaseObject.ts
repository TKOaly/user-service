import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";

/**
 * Represents a privacy policy.
 */
export default interface IConsentDatabaseObject {
  id?: number;
  user_id?: number;
  service_id?: number;
  consent?: PrivacyPolicyConsent;
  modified?: Date;
  created?: Date;
}

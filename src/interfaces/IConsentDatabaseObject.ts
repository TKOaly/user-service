import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";

export default interface IConsentDatabaseObject {
  id?: number;
  user_id?: number;
  service_id?: number;
  consent?: PrivacyPolicyConsent;
  modified?: Date;
  created?: Date;
}

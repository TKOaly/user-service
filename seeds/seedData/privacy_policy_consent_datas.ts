import PrivacyPolicyConsent from "../../src/enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../../src/interfaces/IConsentDatabaseObject";

const privacyPolicy: IConsentDatabaseObject[] = [
  {
    // Test user has accepted KJYR policy
    consent: PrivacyPolicyConsent.Accepted,
    id: 1,
    created: new Date(),
    modified: new Date(),
    user_id: 1,
    service_id: 2
  }
];

export default privacyPolicy;

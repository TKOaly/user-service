import PrivacyPolicyConsent from "../../src/enum/PrivacyPolicyConsent";
import ConsentDatabaseObject from "../../src/interfaces/ConsentDatabaseObject";

const privacyPolicy: ConsentDatabaseObject[] = [
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

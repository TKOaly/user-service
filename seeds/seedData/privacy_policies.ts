import IPrivacyPolicyDatabaseObject from "../../src/interfaces/IPrivacyPolicyDatabaseObject";

const privacyPolicy: IPrivacyPolicyDatabaseObject[] = [
  {
    id: 1,
    service_id: 1,
    text: "Event calendar privacy policy",
    created: new Date(),
    modified: new Date()
  },
  {
    id: 2,
    service_id: 2,
    text: "KJYR privacy policy",
    created: new Date(),
    modified: new Date()
  },
  {
    id: 3,
    service_id: 3,
    text: "Tenttiarkisto privacy policy",
    created: new Date(),
    modified: new Date()
  },
  {
    id: 4,
    service_id: 4,
    text: "Arkisto privacy policy",
    created: new Date(),
    modified: new Date()
  }
];

export default privacyPolicy;

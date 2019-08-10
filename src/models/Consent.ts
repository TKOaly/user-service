import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import ConsentDatabaseObject from "../interfaces/ConsentDatabaseObject";

export default class Consent {
  public id: number;
  public user_id: number;
  public service_id: number;
  public consent: PrivacyPolicyConsent;
  public modified: Date;
  public created: Date;

  constructor(consent: ConsentDatabaseObject) {
    this.id = consent.id;
    this.user_id = consent.user_id;
    this.service_id = consent.service_id;
    this.consent = consent.consent;
    this.modified = consent.modified;
    this.created = consent.created;
  }
}

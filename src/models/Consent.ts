import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";

export default class Consent implements IConsentDatabaseObject {
  public id: number;
  public user_id: number;
  public service_id: number;
  public consent: PrivacyPolicyConsent;
  public modified: Date;
  public created: Date;

  constructor(consent: IConsentDatabaseObject) {
    Object.keys(consent).forEach((key: keyof IConsentDatabaseObject) => {
      this[key] = consent[key];
    });
  }
}

import PrivacyPolicyDatabaseObject from "../interfaces/PrivacyPolicyDatabaseObject";

export default class PrivacyPolicy {
  public id: number;
  public service_id: number;
  public text: string;
  public modified: Date;
  public created: Date;

  constructor(privacyPolicy: PrivacyPolicyDatabaseObject) {
    this.id = privacyPolicy.id;
    this.service_id = privacyPolicy.service_id;
    this.text = privacyPolicy.text;
    this.modified = privacyPolicy.modified;
    this.created = privacyPolicy.created;
  }
}

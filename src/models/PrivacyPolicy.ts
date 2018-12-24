import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";

export default class PrivacyPolicy implements IPrivacyPolicyDatabaseObject {
  public id?: number;
  public service_id?: number;
  public text?: string;
  public modified?: Date;
  public created?: Date;

  constructor(privacyPolicy: IPrivacyPolicyDatabaseObject) {
    Object.keys(privacyPolicy).forEach((key: keyof IPrivacyPolicyDatabaseObject) => {
      this[key] = privacyPolicy[key];
    });
  }
}

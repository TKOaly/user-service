import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";

/**
 * Privacy policy model.
 *
 * @export
 * @class PrivacyPolicy
 * @implements {IPrivacyPolicyDatabaseObject}
 */
export default class PrivacyPolicy implements IPrivacyPolicyDatabaseObject {
  /**
   * ID
   *
   * @type {number}
   * @memberof PrivacyPolicy
   */
  public id?: number;
  /**
   * Name
   *
   * @type {number}
   * @memberof PrivacyPolicy
   */
  public service_id?: number;
  /**
   * Service
   *
   * @type {string}
   * @memberof PrivacyPolicy
   */
  public text?: string;
  /**
   * Modified
   *
   * @type {Date}
   * @memberof PrivacyPolicy
   */
  public modified?: Date;
  /**
   * Created
   *
   * @type {Date}
   * @memberof PrivacyPolicy
   */
  public created?: Date;

  constructor(privacyPolicy: IPrivacyPolicyDatabaseObject) {
    Object.keys(privacyPolicy).forEach((key: keyof IPrivacyPolicyDatabaseObject) => {
      this[key] = privacyPolicy[key];
    });
  }
}

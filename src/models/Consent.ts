import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";

/**
 * Consent model.
 *
 * @export
 * @class Consent
 * @implements {IConsentDatabaseObject}
 */
export default class Consent implements IConsentDatabaseObject {
  /**
   * ID
   *
   * @type {number}
   * @memberof Consent
   */
  public id: number;
  /**
   * User ID
   *
   * @type {number}
   * @memberof Consent
   */
  public user_id: number;
  /**
   * Service ID
   *
   * @type {number}
   * @memberof Consent
   */
  public service_id: number;
  /**
   * Consent status
   *
   * @type {PrivacyPolicyConsent}
   * @memberof Consent
   */
  public consent: PrivacyPolicyConsent;
  /**
   * Modified date
   *
   * @type {Date}
   * @memberof Consent
   */
  public modified: Date;
  /**
   * Created date
   *
   * @type {Date}
   * @memberof Consent
   */
  public created: Date;

  /**
   * Creates an instance of Consent.
   * @param {IConsentDatabaseObject} consent
   * @memberof Consent
   */
  constructor(consent: IConsentDatabaseObject) {
    Object.keys(consent).forEach((key: string) => {
      this[key] = consent[key];
    });
  }
}

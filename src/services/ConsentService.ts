import ConsentDao from "../dao/ConsentDao";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";
import IService from "../interfaces/IService";
import Consent from "../models/Consent";
import ServiceError from "../utils/ServiceError";

/**
 * Consent service.
 *
 * @export
 * @class ConsentService
 * @implements {IService<Consent>}
 */
export default class ConsentService implements IService<Consent> {
  /**
   * Creates an instance of ConsentService.
   * @param {ConsentDao} consentDao
   * @memberof ConsentService
   */
  constructor(private readonly consentDao: ConsentDao) {}

  /**
   * Finds a single consent.
   *
   * @param {number} id Consent ID
   * @returns {Promise<Consent>} Consent
   * @memberof ConsentService
   */
  public async findOne(id: number): Promise<Consent> {
    const consent: IConsentDatabaseObject = await this.consentDao.findOne(id);
    if (!consent) {
      throw new ServiceError(404, "Not found");
    }
    return new Consent(consent);
  }

  /**
   * Resets all consents to unknown in a service (That have not been declined.)
   *
   * @param {number} service_id Service ID
   * @returns {Promise<number[]>}
   * @memberof ConsentService
   */
  public async resetAllAcceptedByService(
    service_id: number
  ): Promise<number[]> {
    const res: number[] = await this.consentDao.resetAllAcceptedByService(
      service_id
    );
    return res;
  }

  /**
   * Finds all consents.
   *
   * @returns {Promise<Consent[]>} All consents
   * @memberof ConsentService
   */
  public async findAll(): Promise<Consent[]> {
    const consents: IConsentDatabaseObject[] = await this.consentDao.findAll();
    return consents.map(
      (consent: IConsentDatabaseObject) => new Consent(consent)
    );
  }

  /**
   * Updates a consent.
   *
   * @param {number} entity_id Consent ID
   * @param {Consent} entity Consent
   * @returns {Promise<boolean>}
   * @memberof ConsentService
   */
  public async update(entity_id: number, entity: Consent): Promise<number> {
    const res: number = await this.consentDao.update(entity_id, entity);
    return res;
  }

  /**
   * Deletes a consent.
   *
   * @param {number} entity_id Consent ID
   * @returns {Promise<boolean>}
   * @memberof ConsentService
   */
  public async delete(entity_id: number): Promise<boolean> {
    const res: boolean = await this.consentDao.remove(entity_id);
    return res;
  }

  /**
   * Creates a consent.
   *
   * @param {Consent} entity
   * @returns {Promise<number[]>}
   * @memberof ConsentService
   */
  public async create(entity: Consent): Promise<number[]> {
    const res: number[] = await this.consentDao.save(entity);
    return res;
  }

  /**
   * Declines a privacy policy for a service.
   * If a consent's value is undefined, update it to "declined"
   *
   * @param {number} user_id User ID
   * @param {number} service_id Service ID
   * @returns {Promise<number[]>}
   * @memberof ConsentService
   */
  public async declineConsent(
    user_id: number,
    service_id: number
  ): Promise<number[]> {
    const res: IConsentDatabaseObject = await this.consentDao.findByUserAndService(
      user_id,
      service_id
    );
    if (res) {
      // Consent exists, check for state
      if (res.consent === PrivacyPolicyConsent.Declined) {
        // Already declined, do nothing
        return [1];
      } else if (res.consent === PrivacyPolicyConsent.Accepted) {
        // Accepted, update to declined.
        // Otherwise, the status is unknown.
        const updated: number = await this.consentDao.update(res.id, {
          consent: PrivacyPolicyConsent.Declined
        });
        return [updated];
      } else {
        // Otherwise, the status is unknown.
        const updated: number = await this.consentDao.update(res.id, {
          consent: PrivacyPolicyConsent.Declined
        });
        return [updated];
      }
    } else {
      // Consent doesn't exist, create one
      const consentData: IConsentDatabaseObject = {
        user_id,
        service_id,
        consent: PrivacyPolicyConsent.Declined
      };
      const inserted: number[] = await this.consentDao.save(consentData);
      return inserted;
    }
  }

  /**
   * Finds a consent by user and a service.
   *
   * @param {number} user_id User id
   * @param {number} service_id Service id
   * @returns {Promise<Consent>}
   * @memberof ConsentService
   */
  public async findByUserAndService(
    user_id: number,
    service_id: number
  ): Promise<Consent> {
    const res: IConsentDatabaseObject = await this.consentDao.findByUserAndService(
      user_id,
      service_id
    );
    if (!res) {
      return null;
    }
    return new Consent(res);
  }

  /**
   * Accepts a privacy policy for a service.
   * If a consent is declined, throw an error.
   * If a consent is undefined, update it to "accepted"
   *
   * @param {number} user_id User ID
   * @param {number} service_id Service ID
   * @returns {Promise<number[]>}
   * @memberof ConsentService
   */
  public async acceptConsent(
    user_id: number,
    service_id: number
  ): Promise<number[]> {
    const res: IConsentDatabaseObject = await this.consentDao.findByUserAndService(
      user_id,
      service_id
    );
    if (res) {
      // Consent exists, check for state
      if (res.consent === PrivacyPolicyConsent.Accepted) {
        // Already accepted, do nothing
        return [1];
      } else {
        // Otherwise, the status is unknown or declined.
        const updated: number = await this.consentDao.update(res.id, {
          consent: PrivacyPolicyConsent.Accepted
        });
        return [updated];
      }
    } else {
      // Consent doesn't exist, create one
      const consentData: IConsentDatabaseObject = {
        user_id,
        service_id,
        consent: PrivacyPolicyConsent.Accepted
      };
      const inserted: number[] = await this.consentDao.save(consentData);
      return inserted;
    }
  }
}

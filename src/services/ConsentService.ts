import ConsentDao from "../dao/ConsentDao";
import PrivacyPolicyConsent from "../enum/PrivacyPolicyConsent";
import IConsentDatabaseObject from "../interfaces/IConsentDatabaseObject";
import IService from "../interfaces/IService";
import Consent from "../models/Consent";
import ServiceError from "../utils/ServiceError";

export default class ConsentService implements IService<Consent> {
  constructor(private readonly consentDao: ConsentDao) {}

  public async findOne(id: number): Promise<Consent> {
    const consent: IConsentDatabaseObject = await this.consentDao.findOne(id);
    if (!consent) {
      throw new ServiceError(404, "Not found");
    }
    return new Consent(consent);
  }

  /**
   * Resets all consents to unknown in a service (That have not been declined.)
   */
  public async resetAllAcceptedByService(
    service_id: number
  ): Promise<number[]> {
    const res: number[] = await this.consentDao.resetAllAcceptedByService(
      service_id
    );
    return res;
  }

  public async findAll(): Promise<Consent[]> {
    const consents: IConsentDatabaseObject[] = await this.consentDao.findAll();
    return consents.map(
      (consent: IConsentDatabaseObject) => new Consent(consent)
    );
  }

  public async update(entity_id: number, entity: Consent): Promise<number> {
    const res: number = await this.consentDao.update(entity_id, entity);
    return res;
  }

  public async delete(entity_id: number): Promise<boolean> {
    const res: boolean = await this.consentDao.remove(entity_id);
    return res;
  }

  public async create(entity: Consent): Promise<number[]> {
    const res: number[] = await this.consentDao.save(entity);
    return res;
  }

  /**
   * Declines a privacy policy for a service.
   * If a consent's value is undefined, update it to "declined"
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

import PrivacyPolicyDao from "../dao/PrivacyPolicyDao";
import IPrivacyPolicyDatabaseObject from "../interfaces/IPrivacyPolicyDatabaseObject";
import IService from "../interfaces/IService";
import PrivacyPolicy from "../models/PrivacyPolicy";
import ServiceError from "../utils/ServiceError";

/**
 * Privacy policy service.
 *
 * @export
 * @class PrivacyPolicyService
 * @implements {IService<PrivacyPolicy>}
 */
export default class PrivacyPolicyService implements IService<PrivacyPolicy> {
  /**
   * Creates an instance of PrivacyPolicyService.
   * @param {PrivacyPolicyDao} privacyPolicyDao
   * @memberof PrivacyPolicyService
   */
  constructor(private readonly privacyPolicyDao: PrivacyPolicyDao) {}
  /**
   * Finds one privacy policy.
   *
   * @param {number} id Privacy policy ID
   * @returns {Promise<PrivacyPolicy>}
   * @memberof PrivacyPolicyService
   */
  public async findOne(id: number): Promise<PrivacyPolicy> {
    const res: IPrivacyPolicyDatabaseObject = await this.privacyPolicyDao.findOne(
      id
    );
    if (!res) {
      throw new ServiceError(404, "Not found");
    }
    return new PrivacyPolicy(res);
  }

  /**
   * Finds a privacy policy by service identifier.
   *
   * @param {string} serviceIdentifier
   * @returns {Promise<PrivacyPolicy>}
   * @memberof PrivacyPolicyService
   */
  public async findByServiceIdentifier(
    serviceIdentifier: string
  ): Promise<PrivacyPolicy> {
    const res: IPrivacyPolicyDatabaseObject = await this.privacyPolicyDao.findByServiceIdentifier(
      serviceIdentifier
    );
    if (!res) {
      throw new ServiceError(404, "Not found");
    }
    return new PrivacyPolicy(res);
  }
  public findAll(): Promise<PrivacyPolicy[]> {
    throw new Error("Method not implemented.");
  }
  public update(entity_id: number, entity: PrivacyPolicy): Promise<number> {
    throw new Error("Method not implemented.");
  }
  public delete(entity_id: number): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public create(entity: PrivacyPolicy): Promise<number[]> {
    throw new Error("Method not implemented.");
  }
}

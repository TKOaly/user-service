import PrivacyPolicyDao from "../dao/PrivacyPolicyDao";
import Service from "../interfaces/Service";
import PrivacyPolicy from "../models/PrivacyPolicy";
import ServiceError from "../utils/ServiceError";

class PrivacyPolicyService implements Service<PrivacyPolicy> {
  public async findOne(id: number): Promise<PrivacyPolicy> {
    const res = await PrivacyPolicyDao.findOne(id);
    if (!res) {
      throw new ServiceError(404, "Privacy policy not found");
    }
    return new PrivacyPolicy(res);
  }

  public async findByServiceIdentifier(serviceIdentifier: string): Promise<PrivacyPolicy> {
    const res = await PrivacyPolicyDao.findByServiceIdentifier(serviceIdentifier);
    if (!res) {
      throw new ServiceError(404, "Privacy policy not found");
    }
    return new PrivacyPolicy(res);
  }

  public findAll(): Promise<PrivacyPolicy[]> {
    throw new Error("Method not implemented.");
  }

  public async update(
    id: number,
    privacyPolicy: Partial<PrivacyPolicy> & Pick<PrivacyPolicy, "service_id" | "text">,
  ): Promise<number> {
    return PrivacyPolicyDao.update(id, privacyPolicy);
  }

  public delete(_entity_id: number): Promise<number> {
    throw new Error("Method not implemented.");
  }

  public async create(privacyPolicy: Pick<PrivacyPolicy, "service_id" | "text">): Promise<number[]> {
    return PrivacyPolicyDao.save(privacyPolicy);
  }
}

export default new PrivacyPolicyService();

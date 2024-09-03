import ServiceDao from "../dao/ServiceDao";
import Service, { IService } from "../models/Service";

class ServiceService {
  public async fetchAll(): Promise<Service[]> {
    const results = await ServiceDao.findAll();
    return results.map(result => new Service(result));
  }

  public async fetchById(id: string): Promise<Service | null> {
    const result = await ServiceDao.findByIdentifier(id);
    return result ? new Service(result) : null;
  }

  public async create(service: Omit<IService, "id">): Promise<number[]> {
    const result = await ServiceDao.save({
      service_name: service.serviceName,
      display_name: service.displayName,
      redirect_url: service.redirectUrl,
      data_permissions: service.dataPermissions,
      service_identifier: service.serviceIdentifier,
    });

    return result;
  }

  public async update(service: Service): Promise<number> {
    const result = await ServiceDao.update(service.id, service.getDatabaseObject());
    return result;
  }

  public async delete(id: number): Promise<number> {
    const result = await ServiceDao.remove(id);
    return result;
  }

  public async deleteByIdentifier(identifier: string): Promise<number> {
    const service = await this.fetchById(identifier);

    if (!service) {
      throw new Error("Service not found");
    }

    return this.delete(service.id);
  }
}

export default new ServiceService();

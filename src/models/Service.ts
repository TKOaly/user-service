export interface ServiceDatabaseObject {
  id: number;
  service_name: string;
  display_name: string;
  redirect_url: string;
  service_identifier: string;
  data_permissions: number;
  modified: Date;
  created: Date;
  secret: string | null;
}

export interface IService {
  id: number;
  serviceName: string;
  serviceIdentifier: string;
  displayName: string;
  redirectUrl: string;
  dataPermissions: number;
  secret: string | null;
  createdAt: Date;
  modifiedAt: Date;
}

export default class Service {
  public id: number;
  public serviceName: string;
  public serviceIdentifier: string;
  public displayName: string;
  public redirectUrl: string;
  public dataPermissions: number;
  public secret: string | null;

  public createdAt: Date;

  public modifiedAt: Date;

  constructor(databaseObject: ServiceDatabaseObject) {
    this.id = databaseObject.id;
    this.serviceName = databaseObject.service_name;
    this.displayName = databaseObject.display_name;
    this.redirectUrl = databaseObject.redirect_url;
    this.serviceIdentifier = databaseObject.service_identifier;
    this.dataPermissions = databaseObject.data_permissions;
    this.modifiedAt = databaseObject.modified;
    this.createdAt = databaseObject.created;
    this.secret = databaseObject.secret;
  }

  public getDatabaseObject(): ServiceDatabaseObject {
    return {
      id: this.id,
      service_name: this.serviceName,
      data_permissions: this.dataPermissions,
      display_name: this.displayName,
      redirect_url: this.redirectUrl,
      service_identifier: this.serviceIdentifier,
      modified: this.modifiedAt,
      created: this.createdAt,
      secret: this.secret,
    } as ServiceDatabaseObject;
  }

  public static createUpdatedService(service: Service, updatedService: Omit<Partial<IService>, "id">): Service {
    return new Service({
      id: service.id,
      service_name: updatedService.serviceName ?? service.serviceName,
      display_name: updatedService.displayName ?? service.displayName,
      redirect_url: updatedService.redirectUrl ?? service.redirectUrl,
      service_identifier: updatedService.serviceIdentifier ?? service.serviceIdentifier,
      data_permissions: updatedService.dataPermissions ?? service.dataPermissions,
      modified: new Date(),
      created: service.createdAt,
      // Exception: if new secret is nullish, keep the old one.
      // This is to avoid empty strings as secrets.
      secret: updatedService.secret || service.secret,
    });
  }
}

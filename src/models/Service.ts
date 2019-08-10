export default class Service {
  public id: number;
  public serviceName: string;
  public serviceIdentifier: string;
  public displayName: string;
  public redirectUrl: string;
  public dataPermissions: number;

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
    } as ServiceDatabaseObject;
  }
}

export interface ServiceDatabaseObject {
  id: number;
  service_name: string;
  display_name: string;
  redirect_url: string;
  service_identifier: string;
  data_permissions: number;
  modified: Date;
  created: Date;
}

export default class Service {
  id: number;
  serviceName: string;
  serviceIdentifier: string;
  displayName: string;
  redirectUrl: string;
  dataPermissions: number;

  constructor(databaseObject: any) {
    this.id = databaseObject.id;
    this.serviceName = databaseObject.service_name;
    this.displayName = databaseObject.display_name;
    this.redirectUrl = databaseObject.redirect_url;
    this.serviceIdentifier = databaseObject.service_identifier;
    this.dataPermissions = databaseObject.data_permissions;
  }
}

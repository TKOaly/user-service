export default class Service {
  id: number;
  serviceName: string;
  dataPermissions: number;

  constructor(databaseObject: any) {
    this.id = databaseObject.id;
    this.serviceName = databaseObject.service_name;
    this.dataPermissions = databaseObject.data_permissions;
  }
}
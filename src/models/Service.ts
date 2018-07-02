/**
 * Service object.
 *
 * @export
 * @class Service
 */
export default class Service {
  /**
   * Service id.
   *
   * @type {number}
   * @memberof Service
   */
  public id: number;
  /**
   * Service name.
   *
   * @type {string}
   * @memberof Service
   */
  public serviceName: string;
  /**
   * Service identifier.
   *
   * @type {string}
   * @memberof Service
   */
  public serviceIdentifier: string;
  /**
   * Display name.
   *
   * @type {string}
   * @memberof Service
   */
  public displayName: string;
  /**
   * Redirect url.
   *
   * @type {string}
   * @memberof Service
   */
  public redirectUrl: string;
  /**
   * Data permissions.
   *
   * @type {number}
   * @memberof Service
   */
  public dataPermissions: number;

  /**
   * Creates an instance of Service.
   * @param {ServiceDatabaseObject} databaseObject
   * @memberof Service
   */
  constructor(databaseObject: IServiceDatabaseObject) {
    this.id = databaseObject.id;
    this.serviceName = databaseObject.service_name;
    this.displayName = databaseObject.display_name;
    this.redirectUrl = databaseObject.redirect_url;
    this.serviceIdentifier = databaseObject.service_identifier;
    this.dataPermissions = databaseObject.data_permissions;
  }
}

/**
 * Service database object.
 *
 * @interface ServiceDatabaseObject
 */
export interface IServiceDatabaseObject {
  id?: number;
  service_name?: string;
  display_name?: string;
  redirect_url?: string;
  service_identifier?: string;
  data_permissions?: number;
}

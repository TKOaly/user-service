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
   * Created at date.
   *
   * @type {Date}
   * @memberof Service
   */
  public createdAt: Date;

  /**
   * Modified at date.
   *
   * @type {Date}
   * @memberof Service
   */
  public modifiedAt: Date;

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
    this.modifiedAt = databaseObject.modified;
    this.createdAt = databaseObject.created;
  }

  /**
   * Returns the database object of the service.
   *
   * @returns {IServiceDatabaseObject} Database object of the service.
   * @memberof Service
   */
  public getDatabaseObject(): IServiceDatabaseObject {
    return {
      id: this.id,
      service_name: this.serviceName,
      data_permissions: this.dataPermissions,
      display_name: this.displayName,
      redirect_url: this.redirectUrl,
      service_identifier: this.serviceIdentifier,
      modified: this.modifiedAt,
      created: this.createdAt
    } as IServiceDatabaseObject;
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
  modified?: Date;
  created?: Date;
}

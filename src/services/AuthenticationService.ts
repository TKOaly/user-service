// @ts-ignore
import compare from "secure-compare";
import sha1 from "sha1";
import ServiceDao from "../dao/ServiceDao";
import Service, { IServiceDatabaseObject } from "../models/Service";
import ServiceToken, { stringToServiceToken } from "../token/Token";
import ServiceError from "../utils/ServiceError";

/**
 * Authentication service.
 *
 * @export
 * @class AuthenticationService
 */
export default class AuthenticationService {
  /**
   * Creates an instance of AuthenticationService.
   * @param {UserDao} userDao UserDao
   * @param {ServiceDao} serviceDao ServiceDao
   * @memberof AuthenticationService
   */
  constructor(private readonly serviceDao: ServiceDao) {}

  /**
   * Returns a single service by its name.
   *
   * @param {string} serviceName
   * @returns {Promise<Service>}
   * @memberof AuthenticationService
   */
  public async getService(serviceName: string): Promise<Service> {
    const service: IServiceDatabaseObject = await this.serviceDao.findByName(serviceName);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  /**
   * Returns a single service by its identifier.
   *
   * @param {string} service_identifier
   * @returns {Promise<Service>}
   * @memberof AuthenticationService
   */
  public async getServiceWithIdentifier(service_identifier: string): Promise<Service> {
    const service: IServiceDatabaseObject = await this.serviceDao.findByIdentifier(service_identifier);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  /**
   * Returns all services.
   *
   * @returns {Promise<Service[]>}
   * @memberof AuthenticationService
   */
  public async getServices(): Promise<Service[]> {
    const services: IServiceDatabaseObject[] = await this.serviceDao.findAll();

    return services.map((service: IServiceDatabaseObject) => new Service(service));
  }

  /**
   * Appends a new service to the authentication token.
   *
   * @param {(string | ServiceToken)} oldToken
   * @param {string} newServiceName
   * @returns {string}
   * @memberof AuthenticationService
   */
  public appendNewServiceAuthenticationToToken(oldToken: string | ServiceToken, newServiceName: string): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt);
    }
    if (token.authenticatedTo) {
      token.authenticatedTo.push(newServiceName);
    } else {
      token.authenticatedTo = [newServiceName];
    }
    try {
      return token.toString();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Remove a service from the authentication token.
   *
   * @param {(string | ServiceToken)} oldToken
   * @param {string} serviceToRemove
   * @returns {string}
   * @memberof AuthenticationService
   */
  public removeServiceAuthenticationToToken(oldToken: string | ServiceToken, serviceToRemove: string): string {
    let token: ServiceToken;
    if (typeof oldToken === "string") {
      token = stringToServiceToken(oldToken);
    } else {
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.createdAt);
    }
    const newServiceList: string[] = [];
    token.authenticatedTo.forEach((s: string) => {
      if (s !== serviceToRemove) {
        newServiceList.push(s);
      }
    });
    token.authenticatedTo = newServiceList;
    try {
      return token.toString();
    } catch (e) {
      throw e;
    }
  }

  /**
   * Creates token.
   *
   * @param {number} userId
   * @param {string[]} authenticatedTo
   * @returns {string}
   * @memberof AuthenticationService
   */
  public createToken(userId: number, authenticatedTo: string[]): string {
    try {
      return new ServiceToken(userId, authenticatedTo, new Date()).toString();
    } catch (e) {
      throw e;
    }
  }
}

/**
 * Validates password.
 *
 * @export
 * @param {string} password
 * @param {string} salt
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export async function validatePassword(password: string, salt: string, hashedPassword: string): Promise<boolean> {
  return await compare(sha1(`${salt}kekbUr${password}`), hashedPassword);
}

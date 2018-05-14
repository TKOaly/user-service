import * as sha1 from "sha1";
import * as Knex from "knex";
import * as jwt from "jsonwebtoken";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";
import Service from "../models/Service";
import { ServiceToken, stringToServiceToken } from "../token/Token";
import UserDao from "../dao/UserDao";
import ServiceDao from "../dao/ServiceDao";
import * as bcrypt from "bcrypt";

/**
 * Authentication service.
 *
 * @export
 * @class AuthenticationService
 */
export class AuthenticationService {
  /**
   * Creates an instance of AuthenticationService.
   * @param {UserDao} userDao UserDao
   * @param {ServiceDao} serviceDao ServiceDao
   * @memberof AuthenticationService
   */
  constructor(
    private readonly userDao: UserDao,
    private readonly serviceDao: ServiceDao
  ) {}

  /**
   * Returns a single service by its name.
   *
   * @param {string} serviceName
   * @returns {Promise<Service>}
   * @memberof AuthenticationService
   */
  async getService(serviceName: string): Promise<Service> {
    const service = await this.serviceDao.findByName(serviceName);
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
  async getServiceWithIdentifier(service_identifier: string): Promise<Service> {
    const service = await this.serviceDao.findByIdentifier(service_identifier);
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
  async getServices(): Promise<Service[]> {
    const services = await this.serviceDao.findAll();

    return services.map(service => new Service(service));
  }

  /**
   * Appends a new service to the authentication token.
   *
   * @param {(string | any)} oldToken
   * @param {string} newServiceName
   * @returns {string}
   * @memberof AuthenticationService
   */
  appendNewServiceAuthenticationToToken(
    oldToken: string | any,
    newServiceName: string
  ): string {
    let token: ServiceToken;
    if (typeof oldToken == "string") {
      token = stringToServiceToken(oldToken);
    } else {
      token = new ServiceToken(
        oldToken.userId,
        oldToken.authenticatedTo,
        oldToken.createdAt
      );
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
   * Creates token.
   *
   * @param {number} userId
   * @param {string[]} authenticatedTo
   * @returns {string}
   * @memberof AuthenticationService
   */
  createToken(userId: number, authenticatedTo: string[]): string {
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
export async function validatePassword(
  password: string,
  salt: string,
  hashedPassword: string
): Promise<boolean> {
  if (salt === '0' && hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  } else {
    return sha1(`${salt}kekbUr${password}`) === hashedPassword;
  }
}

import * as sha1 from "sha1";
import * as Knex from "knex";
import * as jwt from "jsonwebtoken";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";
import Service from "../models/Service";
import { ServiceToken, stringToServiceToken } from "../token/Token";
import UserDao from "../dao/UserDao";
import ServiceDao from "../dao/ServiceDao";
import * as bcrypt from 'bcrypt';

export class AuthenticationService {
  constructor(
    private readonly userDao: UserDao,
    private readonly serviceDao: ServiceDao
  ) {}

  /**
   * Excanges username and password to access token
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Token>}
   */
  async fetchTokenWithUsernameAndPassword(username, password): Promise<string> {
    const dbUser = await this.userDao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);
    let isPasswordCorrect = await validatePassword(password, user.salt, user.hashedPassword);
    if (isPasswordCorrect) {
      return this.createToken(user.id, []);
    } else throw new ServiceError(403, "Password or username doesn't match");
  }

  async getService(serviceName: string): Promise<Service> {
    const service = await this.serviceDao.findByName(serviceName);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  async getServiceWithIdentifier(service_identifier: string): Promise<Service> {
    const service = await this.serviceDao.findByIdentifier(service_identifier);
    if (!service) {
      throw new ServiceError(404, "Service not found");
    }
    return new Service(service);
  }

  async getServices(): Promise<Service[]> {
    const services = await this.serviceDao.findAll();

    return services.map(service => new Service(service));
  }

  appendNewServiceAuthenticationToToken(
    oldToken: string | any,
    newServiceName: string
  ): string {
    let token: ServiceToken;
    if (typeof oldToken == "string") token = stringToServiceToken(oldToken);
    else
      token = new ServiceToken(
        oldToken.userId,
        oldToken.authenticatedTo,
        oldToken.createdAt
      );
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

  createToken(userId: number, authenticatedTo: string[]): string {
    try {
      return new ServiceToken(userId, authenticatedTo, new Date()).toString();
    } catch (e) {
      throw e;
    }
  }
}

/**
 * @param {string} password
 * @param {string} salt
 * @returns {string}
 */
export async function validatePassword(password, salt, hashedPassword): Promise<boolean> {
  if (salt == null && hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  } else return sha1(`${salt}kekbUr${password}`) === hashedPassword;
}

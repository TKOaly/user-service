import * as sha1 from 'sha1';
import * as Knex from 'knex';
import * as jwt from 'jsonwebtoken';
import User from '../models/User';
import ServiceError from '../utils/ServiceError';
import Service from '../models/Service';
import { ServiceToken, stringToServiceToken } from '../token/Token';

export class AuthenticationService {
  constructor(private knex: Knex) {
    this.knex = knex;
  }

  /**
   * Excanges username and password to access token
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Token>} 
   */
  async fetchTokenWithUsernameAndPassword(username, password): Promise<string> {
    let userArray = await this.knex.select('users.*')
      .from('users')
      .where({ username })
      .limit(1);
    if (!userArray.length) {
      throw new ServiceError(404, 'User not found');
    }

    let user = new User(userArray[0]);
    let hashedPassword = generateHashWithPasswordAndSalt(password, user.salt);
    if (hashedPassword === user.hashedPassword) {
      return this.createToken(user.id, user.role, []);
    } else throw new ServiceError(403, 'Password or username doesn\'t match');
  }

  async getService(serviceName: string): Promise<Service> {
    let serviceArray = await this.knex.select()
      .from('services')
      .where({ service_name: serviceName })
      .limit(1);
    if (!serviceArray.length) {
      throw new ServiceError(404, 'Sevice not found');
    }

    return new Service(serviceArray[0]);
  }

  appendNewServiceAuthenticationToToken(oldToken: string | any, newServiceName: string): string {
    let token: ServiceToken;
    if (typeof oldToken == 'string')
      token = stringToServiceToken(oldToken);
    else
      token = new ServiceToken(oldToken.userId, oldToken.authenticatedTo, oldToken.userRole, oldToken.createdAt);
    if (token.authenticatedTo) {
      token.authenticatedTo.push(newServiceName);
    } else {
      token.authenticatedTo = [newServiceName];
    }
    try {
      return token.toString();
    } catch(e) {
      throw e;
    }
  }

  createToken(userId: number, userRole: string, authenticatedTo: string[]): string {
    try {
      return new ServiceToken(userId, authenticatedTo, userRole, new Date()).toString();
    } catch (e) {
      throw e;
    }
  }
};

/**
 * @param {string} password
 * @param {string} salt
 * @returns {string}
 */
export function generateHashWithPasswordAndSalt(password, salt) {
  return sha1(`${salt}kekbUr${password}`);
}
import * as sha1 from 'sha1';
import * as Knex from 'knex';
import * as jwt from 'jsonwebtoken';
import User from '../models/User';
import ServiceError from '../utils/ServiceError';
import Service from '../models/Service';

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
      return this.createToken(user.id, 0);
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

  createToken(userId: number, permissionVal: number): string {
    try {
      return jwt.sign({
        userId,
        permissionVal,
        createdAt: Date.now()
      }, process.env.AUTHSERVICE_JWT_SECRET);
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


export function verifyToken(token: string): {
  userId: number;
  createdAt: Date
} {
  let parsedToken: any = jwt.verify(token, process.env.AUTHSERVICE_JWT_SECRET);
  return {
    userId: parsedToken.userId,
    createdAt: new Date(parsedToken.createdAt)
  };
}
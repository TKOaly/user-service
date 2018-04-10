import * as Knex from 'knex';
import ServiceError from '../utils/ServiceError';
import AuthenticationService from './AuthenticationService';
import User from '../models/User';

export default class UserService {
  constructor(private knex: Knex) {
    this.knex = knex;
  }

  async fetchUser(userId: number) {
    let result = await this.knex.select('*').from('users').where({ id: userId }).limit(1);
    if (!result.length) {
      throw new ServiceError(404, 'Not found');
    }

    let user = new User(result[0]);
    return user;
  }
}
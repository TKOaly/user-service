const User = require('../models/User');

const ServiceError = require('../utils/ServiceError');

class UserService {
  constructor(knex) {
    this.knex = knex;
  }

  async fetchUser(token) {
    let result = await this.knex.select('users.*', 'tokens.value', 'tokens.expiresAt').from('users').leftJoin('tokens', 'users.id', '=', 'tokens.ownerId').where({value: token}).limit(1);
    if (!result.length) {
      throw new ServiceError(404, 'Invalid token');
    }

    if (result[0].expiresAt.getTime() < Date.now()) {
      throw new ServiceError(403, 'Token expired. request a new token.');
    }

    let user = new User(result[0]);
    return user;
  }
} 

module.exports = UserService;
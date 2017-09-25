const sha1 = require('sha1');
const ServiceError = require('../utils/ServiceError');

const Token = require('../models/Token');

class AuthenticationService {
  constructor(knex) {
    this.knex = knex;
  }
  
  /**
   * Excanges username and password to access token
   * @param {string} username
   * @param {string} password
   * @returns {Promise<Token>} 
   */
  async fetchToken(username, password) {
    let userArray = await this.knex.select('users.*', 'tokens.value', 'tokens.ownerId', 'tokens.expiresAt').from('users').leftJoin('tokens', 'users.id', '=', 'tokens.ownerId').where({username}).limit(1);
    if (!userArray.length) {
      throw new ServiceError(404, 'User not found');
    }
    
    let user = userArray[0];
    let hashedPassword = generateHashWithPasswordAndSalt(password, user.salt);
    if (hashedPassword === user.hashed_password) {
      let token = new Token(user);
      if (!token.value) {
        // Probably means that there's no token
        token.expiresAt = new Date(Date.now() + (48 * 60 * 60 * 1000));
        token.value = sha1(user.username + Date.now());
        token.ownerId = user.id;

        await this.knex.insert(token).into('tokens');
        return token;
      }

      if (token.expiresAt && token.expiresAt.getTime() < Date.now()) {
        token.expiresAt = new Date(Date.now() + (48 * 60 * 60 * 1000));
        token.value = sha1(user.username + Date.now());
        token.ownerId = user.id;

        await this.knex.insert(token).into('tokens');
        return token;
      }

      if (token.value && token.expiresAt && token.ownerId) {
        return token;
      }
    } else throw new ServiceError(403, 'Password or username doesn\'t match');
  }

  /**
   * Revokes a token
   * @param {string} oldToken
   * @returns {Token}  
   */
  revokeToken(oldToken) { 
  }
};

/**
 * @param {string} password
 * @param {string} salt
 * @returns {string}
 */
function generateHashWithPasswordAndSalt(password, salt) {
  return sha1(`${salt}kekbUr${password}`);
}

module.exports = AuthenticationService;
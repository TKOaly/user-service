import ServiceError from "../utils/ServiceError";
import { validatePassword } from "./AuthenticationService";
import User from "../models/User";
import UserDao from "../dao/UserDao";
import * as bcrypt from "bcrypt";

/**
 * User service.
 *
 * @export
 * @class UserService
 */
export default class UserService {
  /**
   * Creates an instance of UserService.
   * @param {UserDao} userDao
   * @memberof UserService
   */
  constructor(private readonly userDao: UserDao) {}
  /**
   * Returns a single user from the database.
   *
   * @param {number} userId
   * @returns
   * @memberof UserService
   */
  async fetchUser(userId: number): Promise<User> {
    let result: User = await this.userDao.findOne(userId);
    if (!result) {
      throw new ServiceError(404, "Not found");
    }

    return new User(result);
  }

  /**
   * Returns all users.
   *
   * @returns {Promise<User[]>}
   * @memberof UserService
   */
  async fetchAllUsers(): Promise<User[]> {
    const results: User[] = await this.userDao.findAll();
    return results.map(dbObj => new User(dbObj));
  }

  /**
   * Returns all unpaid users.
   *
   * @returns {Promise<User[]>}
   * @memberof UserService
   */
  async fetchAllUnpaidUsers(): Promise<User[]> {
    const results: User[] = await this.userDao.findAllByUnpaidPayment();
    return results.map(dbObj => new User(dbObj));
  }

  /**
   * Searches all users.
   *
   * @param {string} searchTerm
   * @returns {Promise<User[]>}
   * @memberof UserService
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    let results: User[] = await this.userDao.findWhere(searchTerm);
    if (!results.length) {
      throw new ServiceError(404, "No results returned");
    }

    return results.map(res => new User(res));
  }

  async fetchAllWithSelectedFields(fields: string[], conditions?: string[]): Promise<User[]> {
    let conditionQuery: string[] = null;
    if (conditions) {
      conditionQuery = [];
      conditions.forEach(condition => {
        switch(condition) {
          case 'member':
            conditionQuery.push('membership <> \'ei-jasen\'');
            break;
          case 'nonmember':
            conditionQuery.push('membership = \'ei-jasen\'');
            break;
          case 'paid':
            conditionQuery.push('paid is not null');
            break;
          case 'nonpaid':
            conditionQuery.push('(paid <> 1 or paid is null)');
            break;
          case 'revoked':
            conditionQuery.push('deleted = 1')
            break;
        }
      });
    }

    let results = await this.userDao.findAll(fields, conditionQuery);
    if (!results.length) {
      throw new ServiceError(404, "No results returned");
    }

    return results.map(u => new User(u));
  }

  /**
   * Returns username with username and password.
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<User>}
   * @memberof UserService
   */
  async getUserWithUsernameAndPassword(
    username: string,
    password: string
  ): Promise<User> {
    const dbUser: User = await this.userDao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user: User = new User(dbUser);
    let isPasswordCorrect: boolean = await validatePassword(
      password,
      user.salt,
      user.hashedPassword
    );
    if (isPasswordCorrect) {
      // Recrypt password to bcrypt
      if (user.salt !== "0") {
        await this.updateUser(
          user.id,
          new User({
            salt: "0"
          }),
          password
        );
      }
      return user;
    }
    throw new ServiceError(401, "Invalid username or password");
  }

  /**
   * Checks if username is available.
   *
   * @param {string} username
   * @returns {Promise<boolean>}
   * @memberof UserService
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    return this.userDao.findByUsername(username).then(res => !res);
  }

  /**
   * Creates an user.
   *
   * @param {User} user
   * @param {string} password
   * @returns {Promise<number[]>}
   * @memberof UserService
   */
  async createUser(user: User, password: string): Promise<number[]> {
    user.hashedPassword = await bcrypt.hash(password, 13);
    let newUser: User = new User({});
    newUser = Object.assign(newUser, user);
    return await this.userDao.save(newUser);
  }

  /**
   * Updates an user.
   *
   * @param {number} userId
   * @param {User} udpatedUser
   * @param {string} [password]
   * @returns {Promise<boolean>}
   * @memberof UserService
   */
  async updateUser(
    userId: number,
    udpatedUser: User,
    password?: string
  ): Promise<boolean> {
    // re-crypt password
    if (password) {
      udpatedUser.hashedPassword = await bcrypt.hash(password, 13);
    }
    let newUser: User = new User({});
    newUser = Object.assign(newUser, udpatedUser);
    return await this.userDao.update(userId, newUser);
  }
}

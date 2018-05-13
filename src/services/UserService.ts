import * as Knex from "knex";
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
  async fetchUser(userId: number) {
    let result = await this.userDao.findOne(userId);
    if (!result) {
      throw new ServiceError(404, "Not found");
    }

    return new User(result);
  }

  async fetchAllUsers(): Promise<User[]> {
    const results = await this.userDao.findAll();
    return results.map(dbObj => new User(dbObj));
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    let results = await this.userDao.findWhere(searchTerm);
    if (!results.length) {
      throw new ServiceError(404, "No results returned");
    }

    return results.map(res => new User(res));
  }

  async getUserWithUsernameAndPassword(username, password): Promise<User> {
    const dbUser = await this.userDao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);
    let isPasswordCorrect = await validatePassword(
      password,
      user.salt,
      user.hashedPassword
    );
    if (isPasswordCorrect) {
      return user;
    }
    throw new ServiceError(400, "Passwords do not match");
  }

  /**
   * Checks if usernae is available.
   * @param username
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    return this.userDao.findByUsername(username).then(res => !res);
  }

  async createUser(user: User, password: string) {
    user.hashedPassword = await bcrypt.hash(password, 13);
    let newUser = new User({});
    newUser = Object.assign(newUser, user);
    await this.userDao.save(newUser);
  }

  async updateUser(userId: number, udpatedUser: User, password?: string) {
    // re-crypt password
    if (password) {
      udpatedUser.hashedPassword = await bcrypt.hash(password, 13);
    }
    let newUser = new User({});
    newUser = Object.assign(newUser, udpatedUser);
    await this.userDao.update(userId, newUser);
  }
}

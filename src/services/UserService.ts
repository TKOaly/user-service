import * as Knex from "knex";
import ServiceError from "../utils/ServiceError";
import { generateHashWithPasswordAndSalt } from "./AuthenticationService";
import User from "../models/User";

export default class UserService {
  constructor(private knex: Knex) {
    this.knex = knex;
  }

  async fetchUser(userId: number) {
    let result = await this.knex
      .select()
      .from("users")
      .where({ id: userId })
      .limit(1);
    if (!result.length) {
      throw new ServiceError(404, "Not found");
    }

    let user = new User(result[0]);
    return user;
  }

  async fetchAllUsers(): Promise<User[]> {
    let results = await this.knex.select().from("users");
    return results.map(dbObj => new User(dbObj));
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    let results = await this.knex
      .select()
      .from('users')
      .where('username', 'like', `%${searchTerm}%`)
      .orWhere('name', 'like', `%${searchTerm}%`)
      .orWhere('screen_name', 'like', `%${searchTerm}%`)
      .orWhere('email', 'like', `%${searchTerm}%`);
    if (!results.length) {
      throw new ServiceError(404, 'No results returned');
    }

    return results.map(res => new User(res));
  }

  async getUserWithUsernameAndPassword(username, password): Promise<User> {
    const dbUser = await this.knex
      .select()
      .from("users")
      .where({ username })
      .first();
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);
    const hashedPassword = generateHashWithPasswordAndSalt(password, user.salt);
    if (hashedPassword === user.hashedPassword) {
      return user;
    }
    throw new ServiceError(400, "Passwords do not match");
  }

  /**
   * Checks if usernae is available.
   * @param username 
   */
  async checkUsernameAvailability(username: string): Promise<boolean> {
    let result: any = this.knex('users').count('users');
    return result.users === 0;
  }
}

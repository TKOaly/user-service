import * as Knex from "knex";
import User from "../models/User";
import Dao from "./Dao";
import * as Promise from "bluebird";

/**
 * UserDao.
 */
export default class UserDao implements Dao<User> {
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a single user.
   * @param id User id
   */
  findOne(id: number): Promise<User> {
    return this.knex("users")
      .select()
      .where({ id })
      .first();
  }

  /**
   * Finds a user by its username.
   * @param username Username
   */
  findByUsername(username: string): Promise<User> {
    return this.knex("users")
      .select()
      .where({ username })
      .first();
  }

  /**
   * Finds all users.
   */
  findAll(): Promise<User[]> {
    return this.knex("users").select();
  }

  /**
   * Search the user table with the specified search term.
   * @param searchTerm Search term
   */
  findWhere(searchTerm): Promise<User[]> {
    return this.knex
      .select()
      .from("users")
      .where("username", "like", `%${searchTerm}%`)
      .orWhere("name", "like", `%${searchTerm}%`)
      .orWhere("screen_name", "like", `%${searchTerm}%`)
      .orWhere("email", "like", `%${searchTerm}%`);
  }

  /**
   * Removes a user.
   */
  remove(id: number): Promise<boolean> {
    return this.knex("users")
      .delete()
      .where({ id });
  }

  /**
   * Updates a user.
   * @param entity User
   */
  update(entity: User): Promise<boolean> {
    return this.knex("users")
      .update(entity)
      .where({ id: entity.id });
  }

  /**
   * Saves a user.
   * @param entity User
   */
  save(entity: User): Promise<number[]> {
    return this.knex("users").insert(entity.getDatabaseObject());
  }
}

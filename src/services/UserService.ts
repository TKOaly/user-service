import crypto from "crypto";
import sha1 from "sha1";
import UserDao from "../dao/UserDao";
import User from "../models/User";
import { UserPayment } from "../models/UserPayment";
import ServiceError from "../utils/ServiceError";
import { validateLegacyPassword } from "./AuthenticationService";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";
import { hashPasswordAsync, validatePasswordHashAsync } from "../utils/UserHelpers";

class UserService {
  public async fetchUser(userId: number): Promise<User> {
    const result = await UserDao.findOne(userId);
    if (!result) {
      throw new ServiceError(404, "User not found");
    }

    return new User(result);
  }

  public async fetchAllUsers(): Promise<User[]> {
    const results = await UserDao.findAll();
    return results.map(dbObj => new User(dbObj));
  }

  public async fetchAllUnpaidUsers(): Promise<User[]> {
    const results = await UserDao.findAllByUnpaidPayment();
    return results.map(dbObj => new User(dbObj));
  }

  /**
   * Searches all users with the given SQL WHERE condition.
   */
  public async searchUsers(searchTerm: string): Promise<User[]> {
    const results = await UserDao.findWhere(searchTerm);
    if (!results.length) {
      return this.fetchAllUsers();
    }

    return results.map(res => new User(res));
  }

  /**
   * Fetches users with selected fields and those who match the conditions.
   */
  public async fetchAllWithSelectedFields(fields?: string[], conditions?: string[]): Promise<UserPayment[]> {
    let conditionQuery: string[] = [];
    if (conditions) {
      conditionQuery = [];
      conditions.forEach(condition => {
        switch (condition) {
          case "member":
            conditionQuery.push("(membership <> 'ei-jasen' and membership <> 'erotettu')");
            break;
          case "nonmember":
            conditionQuery.push("membership = 'ei-jasen'");
            break;
          case "paid":
            conditionQuery.push("paid is not null");
            break;
          case "nonpaid":
            conditionQuery.push("(paid is null)");
            break;
          case "revoked":
            conditionQuery.push("deleted = 1");
            break;
          default:
            break;
        }
      });
    }

    const results = await UserDao.findAll(fields, conditionQuery);

    // @ts-ignore
    // FIXME: Wrong typings
    return results.map(u => new UserPayment(u));
  }

  public async getUserWithUsernameAndPassword(username: string, password: string): Promise<User> {
    const dbUser = await UserDao.findByUsername(username);
    if (!dbUser) {
      throw new ServiceError(404, "User not found");
    }

    const user = new User(dbUser);

    // if user has bcrypt hash instead of the legacy hash
    if (user.passwordHash) {
      if (await validatePasswordHashAsync(password, user.passwordHash)) {
        return user;
      }

      throw new ServiceError(401, "Invalid username or password");
    }

    const isPasswordCorrect = await validateLegacyPassword(password, user.salt, user.hashedPassword);
    if (isPasswordCorrect) {
      return user;
    }

    throw new ServiceError(401, "Invalid username or password");
  }

  public async checkUsernameAvailability(username: string): Promise<boolean> {
    const user = await UserDao.findByUsername(username);
    return user === undefined;
  }

  public async checkEmailAvailability(email: string): Promise<boolean> {
    const user = await UserDao.findByEmail(email);
    return user === undefined;
  }

  public async createUser(userData: User, rawPassword: string): Promise<number> {
    const { password, salt } = await mkHashedPassword(rawPassword);
    userData.hashedPassword = password;
    userData.salt = salt;
    userData.passwordHash = await hashPasswordAsync(rawPassword);
    const insertIds = await UserDao.save(userData.getDatabaseObject());
    return insertIds[0];
  }

  public async updateUser(
    userId: number,
    updatedUser: Partial<UserDatabaseObject>,
    rawPassword?: string,
  ): Promise<number> {
    const fields = { ...updatedUser };

    if (rawPassword) {
      const { password, salt } = await mkHashedPassword(rawPassword);
      const passwordHash = await hashPasswordAsync(rawPassword);

      Object.assign(fields, {
        password_hash: passwordHash,
        hashed_password: password,
        salt,
      });
    }

    const affectedRows = await UserDao.update(userId, fields);

    return affectedRows;
  }

  public async deleteUser(userId: number): Promise<number> {
    return UserDao.remove(userId);
  }

  public async getUserWithUsername(username: string): Promise<User | null> {
    const dbUser = await UserDao.findByUsername(username);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }

  public async getUserWithEmail(email: string): Promise<User | null> {
    const dbUser = await UserDao.findByEmail(email);
    if (!dbUser) return null;
    const user = new User(dbUser);
    return user;
  }
}

async function mkHashedPassword(rawPassword: string): Promise<{ salt: string; password: string }> {
  const salt = crypto.randomBytes(16).toString("hex").substring(0, 20);
  // The passwords are first hashed according to the legacy format
  // to ensure backwards compability
  const password = sha1(`${salt}kekbUr${rawPassword}`) as string;
  return { salt, password };
}

export default new UserService();

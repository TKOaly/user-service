import IValidator from "./IValidator";
import UserService from "../services/UserService";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";
import * as validator from "validator";

/**
 * Additional user data.
 *
 * @interface AdditionalUserData
 */
interface AdditionalUserData {
  /**
   * Password.
   *
   * @type {string} Password
   * @memberof AdditionalUserData
   */
  password1: string;
  /**
   * Password (typed again).
   *
   * @type {string} Password
   * @memberof AdditionalUserData
   */
  password2: string;
  /**
   * Is the user deleted or not.
   *
   * @type {boolean}
   * @memberof AdditionalUserData
   */
  deleted: boolean;
}

// Colums allowed to be self-edited
const allowedSelfEdit = [
  "screenName", "email", "residence",
  "phone", "isHYYMember", "isTKTL",
  "password1", "password2"];


// Colums allowed to be edited by jäsenvirkailija
const allowedJVEdit = [...allowedSelfEdit];
allowedJVEdit.push("name", "username", "membership");

// Colums allowed to be edited by admin
const allowedAdminEdit = [...allowedJVEdit];
allowedAdminEdit.push("role", "createdAt");
/**
 * User validator.
 *
 * @export
 * @class UserValidator
 * @implements {IValidator<User>}
 */
export default class UserValidator implements IValidator<User> {
  /**
   * Creates an instance of UserValidator.
   * @param {UserService} userService
   * @memberof UserValidator
   */
  constructor(private userService: UserService) { }

  /**
   * Validates user creation.
   *
   * @param {(User & AdditionalUserData)} newUser
   * @memberof UserValidator
   */
  async validateCreate(newUser: User & AdditionalUserData) {
    // Discard user id
    delete newUser.id;

    if (
      !newUser.username ||
      !newUser.name ||
      !newUser.screenName ||
      !newUser.email ||
      !newUser.residence ||
      !newUser.phone ||
      !newUser.password1 ||
      !newUser.password2
    ) {
      throw new ServiceError(400, "Missing required information");
    }

    // Test username
    const usernameAvailable = await this.userService.checkUsernameAvailability(
      newUser.username
    );
    if (!usernameAvailable) {
      throw new ServiceError(400, "Username already taken");
    }

    // Test email
    if (
      !newUser.email ||
      !validator.isEmail(newUser.email) ||
      !validator.isLength(newUser.email, {
        min: 1,
        max: 255
      })
    ) {
      throw new ServiceError(400, "Malformed email");
    }

    newUser.membership = "ei-jasen";
    newUser.role = "kayttaja";
    newUser.deleted = false;

    if (!validator.equals(newUser.password1, newUser.password2)) {
      throw new ServiceError(400, "Passwords do not match");
    }
  }

  /**
   * Validates user update.
   *
   * @param {number} userId
   * @param {User} newUser
   * @memberof UserValidator
   */
  async validateUpdate(userId: number, newUser: User & AdditionalUserData, modifier: User) {
    // Self-edit
    if (userId === modifier.id) {
      Object.keys(newUser).forEach(key => {
        if (allowedSelfEdit.indexOf(key) < 0 && key !== 'id') {
          throw new ServiceError(403, "Forbidden modify action");
        }
      });
    } else if (userId !== modifier.id && modifier.role === "jasenvirkailija") {
      Object.keys(newUser).forEach(key => {
        if (allowedJVEdit.indexOf(key) < 0 && key !== 'id') {
          throw new ServiceError(403, "Forbidden modify action");
        }
      });
    } else if (userId !== modifier.id && modifier.role === "yllapitaja") {
      Object.keys(newUser).forEach(key => {
        if (allowedAdminEdit.indexOf(key) < 0 && key !== 'id') {
          throw new ServiceError(403, "Forbidden modify action");
        }
      });
    } else {
      throw new ServiceError(403, "Forbidden modify action");
    }


    // Remove information that hasn't changed
    const oldUser = await this.userService.fetchUser(userId);
    Object.keys(newUser).forEach(k => {
      if (oldUser[k] == newUser[k]) {
        delete newUser[k];
      }
    });

    if (newUser.username) {
      // Test username
      const usernameAvailable = await this.userService.checkUsernameAvailability(
        newUser.username
      );
      if (!usernameAvailable) {
        throw new ServiceError(400, "Username already taken");
      }
    }

    // Test email
    if (newUser.email) {
      if (
        !validator.isEmail(newUser.email) ||
        !validator.isLength(newUser.email, {
          min: 1,
          max: 255
        })
      ) {
        throw new ServiceError(400, "Malformed email");
      }
    }

    if (newUser.password1 && newUser.password2) {
      if (!validator.equals(newUser.password1, newUser.password2)) {
        throw new ServiceError(400, "Passwords do not match");
      }
    }
  }
}

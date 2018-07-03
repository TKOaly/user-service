import * as validator from "validator";
import UserRoleString from "../enum/UserRoleString";
import IValidator from "../interfaces/IValidator";
import User from "../models/User";
import UserService from "../services/UserService";
import ServiceError from "../utils/ServiceError";
import { stringToBoolean } from "../utils/UserHelpers";

/**
 * Additional user data.
 *
 * @interface IAdditionalUserData
 */
interface IAdditionalUserData {
  /**
   * Password.
   *
   * @type {string} Password
   * @memberof IAdditionalUserData
   */
  password1: string;
  /**
   * Password (typed again).
   *
   * @type {string} Password
   * @memberof IAdditionalUserData
   */
  password2: string;
  /**
   * Is the user deleted or not.
   *
   * @type {boolean}
   * @memberof IAdditionalUserData
   */
  deleted: boolean;
}

// Colums allowed to be self-edited
const allowedSelfEdit: string[] = [
  "screenName",
  "email",
  "residence",
  "phone",
  "isHYYMember",
  "isTKTL",
  "password1",
  "password2"
];

// Colums allowed to be edited by jäsenvirkailija
const allowedJVEdit: string[] = [...allowedSelfEdit];
allowedJVEdit.push("name", "username", "membership");

// Colums allowed to be edited by admin
const allowedAdminEdit: string[] = [...allowedJVEdit];
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
  constructor(private userService: UserService) {}

  /**
   * Validates user creation.
   *
   * @param {(User & IAdditionalUserData)} newUser
   * @memberof UserValidator
   */
  public async validateCreate(
    newUser: User & IAdditionalUserData
  ): Promise<void> {
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
    const usernameAvailable: boolean = await this.userService.checkUsernameAvailability(
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
        max: 255,
        min: 1
      })
    ) {
      throw new ServiceError(400, "Malformed email");
    }

    newUser.membership = "ei-jasen";
    newUser.role = UserRoleString.Kayttaja;
    newUser.deleted = false;
    newUser.isTKTL = stringToBoolean(newUser.isTKTL);

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
  public async validateUpdate(
    userId: number,
    newUser: User & IAdditionalUserData,
    modifier: User
  ): Promise<void> {
    // Remove information that hasn't changed
    const oldUser: User = await this.userService.fetchUser(userId);
    Object.keys(newUser).forEach((k: string) => {
      if (oldUser[k] === newUser[k]) {
        delete newUser[k];
      }
    });

    const error: string = "Forbidden modify action";
    if (userId === modifier.id) {
      newUser.id = userId;
      checkModifyPermission(newUser, allowedSelfEdit);
    } else if (userId !== modifier.id && modifier.role === "jasenvirkailija") {
      checkModifyPermission(newUser, allowedJVEdit);
    } else if (userId !== modifier.id && modifier.role === "yllapitaja") {
      checkModifyPermission(newUser, allowedAdminEdit);
    } else {
      throw new ServiceError(403, error);
    }

    await checkUsernameAvailability(newUser);

    // Test email
    if (
      newUser.email &&
      (!validator.isEmail(newUser.email) ||
        !validator.isLength(newUser.email, {
          max: 255,
          min: 1
        }))
    ) {
      throw new ServiceError(400, "Malformed email");
    }

    if (newUser.isTKTL) {
      newUser.isTKTL = stringToBoolean(newUser.isTKTL);
    }

    if (newUser.isHYYMember) {
      newUser.isHYYMember = stringToBoolean(newUser.isHYYMember);
    }

    if (newUser.password1 && newUser.password2) {
      if (!validator.equals(newUser.password1, newUser.password2)) {
        throw new ServiceError(400, "Passwords do not match");
      }
    }
  }
}

/**
 * Checks modify permission.
 *
 * @param {User} user
 * @param {string[]} allowedEdits
 */
function checkModifyPermission(user: User, allowedEdits: string[]): void {
  const error: string = "Forbidden modify action";
  Object.keys(user).forEach((key: string) => {
    if (allowedEdits.indexOf(key) < 0 && key !== "id") {
      throw new ServiceError(403, error);
    }
  });
}

/**
 * Checks for username availability.
 *
 * @param {User} newUser User object
 * @returns {Promise<void>}
 */
async function checkUsernameAvailability(newUser: User): Promise<void> {
  if (newUser.username) {
    // Test username
    const usernameAvailable: boolean = await this.userService.checkUsernameAvailability(
      newUser.username
    );
    if (!usernameAvailable) {
      throw new ServiceError(400, "Username already taken");
    }
  }
}

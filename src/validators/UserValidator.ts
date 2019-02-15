import * as validator from "validator";
import UserRoleString from "../enum/UserRoleString";
import IValidator from "../interfaces/IValidator";
import User from "../models/User";
import UserService from "../services/UserService";
import ServiceError from "../utils/ServiceError";
import { stringToBoolean } from "../utils/UserHelpers";

export interface IAdditionalUserData {
  password1: string;
  /**
   * Password (typed again).
   */
  password2: string;
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
  "password2",
];

// Colums allowed to be edited by jäsenvirkailija
const allowedJVEdit: string[] = [...allowedSelfEdit, "name", "username", "membership"];

// Colums allowed to be edited by admin
const allowedAdminEdit: string[] = [...allowedJVEdit, "role", "createdAt"];

export default class UserValidator implements IValidator<User> {
  constructor(private userService: UserService) {}

  public async validateCreate(newUser: User & IAdditionalUserData): Promise<void> {
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
    await this.checkUsernameAvailability(newUser);

    // Test email
    if (!this.checkEmailValidity(newUser.email)) {
      throw new ServiceError(400, "Malformed email");
    }

    // Test email for taken
    await this.checkEmailAvailability(newUser);

    newUser.membership = "ei-jasen";
    newUser.role = UserRoleString.Kayttaja;
    newUser.deleted = false;
    newUser.isTKTL = stringToBoolean(newUser.isTKTL);

    if (!validator.equals(newUser.password1, newUser.password2)) {
      throw new ServiceError(400, "Passwords do not match");
    }
  }

  public async validateUpdate(userId: number, newUser: User & IAdditionalUserData, modifier: User): Promise<void> {
    // Remove information that hasn't changed
    const oldUser: User = await this.userService.fetchUser(userId);
    Object.keys(newUser).forEach((k: keyof User) => {
      if (oldUser[k] !== undefined && oldUser[k] === newUser[k]) {
        delete newUser[k];
      }
    });

    const error: string = "Forbidden modify action";
    if (userId === modifier.id) {
      // Self edit
      newUser.id = userId;
      checkModifyPermission(newUser, allowedSelfEdit);
    } else if (userId !== modifier.id && modifier.role === UserRoleString.Jasenvirkailija) {
      // Jasenvirkailija edit
      checkModifyPermission(newUser, allowedJVEdit);
    } else if (userId !== modifier.id && modifier.role === UserRoleString.Yllapitaja) {
      // Yllapitaja edit
      checkModifyPermission(newUser, allowedAdminEdit);
    } else {
      throw new ServiceError(403, error);
    }

    await this.checkUsernameAvailability(newUser);
    await this.checkEmailAvailability(newUser);

    // Test email
    if (newUser.email && !this.checkEmailValidity(newUser.email)) {
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

  public async checkUsernameAvailability(newUser: User): Promise<void> {
    if (newUser.username) {
      // Test username
      const usernameAvailable: boolean = await this.userService.checkUsernameAvailability(newUser.username.trim());
      if (!usernameAvailable) {
        throw new ServiceError(400, "Username already taken");
      }
    }
  }

  public async checkEmailAvailability(newUser: User): Promise<void> {
    if (newUser.email) {
      // Test email
      const emailAvailable: boolean = await this.userService.checkEmailAvailability(newUser.email.trim());
      if (!emailAvailable) {
        throw new ServiceError(400, "Email address already taken");
      }
    }
  }

  public checkEmailValidity(email: string): boolean {
    if (
      !email ||
      !validator.isEmail(email) ||
      !validator.isLength(email, {
        max: 255,
        min: 1,
      })
    ) {
      return false;
    }

    return true;
  }
}

export function checkModifyPermission(user: User, allowedEdits: string[]): void {
  const error: string = "Forbidden modify action";
  Object.keys(user).forEach((key: string) => {
    if (!allowedEdits.find((allowedEdit: string) => allowedEdit === key) && key !== "id") {
      throw new ServiceError(403, error);
    }
  });
}

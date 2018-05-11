import IValidator from "./IValidator";
import UserService from "../services/UserService";
import User from "../models/User";
import ServiceError from "../utils/ServiceError";

export default class UserValidator implements IValidator<User> {
  constructor(private userService: UserService) { }

  async validateCreate(newUser: any) {
    // Discard user id
    delete newUser.id;

    if (!newUser.username ||
      !newUser.name ||
      !newUser.screenName ||
      !newUser.residence ||
      !newUser.phone ||
      !newUser.password1 ||
      !newUser.password2
    ) {
      throw new ServiceError(400, "Missing required information");
    }

    // Test username
    if (!(await this.userService.checkUsernameAvailability(newUser.username))) {
      throw new ServiceError(400, "Username already taken");
    }

    // Test email
    if (!newUser.email || /^\S+@\S+\.\S+$/.exec(newUser.email) || newUser.email.length > 255) {
      throw new ServiceError(400, "Malformed email");
    }

    newUser.membership = "ei-jasen";
    newUser.role = "kayttaja";
    newUser.deleted = false;

    if (newUser.password1 !== newUser.password2) {
      throw new ServiceError(400, "Passwords do not match");
    }
  }

  async validateUpdate(userId: number, newData: User) {
    
  }
}
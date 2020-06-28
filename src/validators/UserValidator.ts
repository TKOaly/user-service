import { isEmail, isLength, equals } from "validator";
import UserRoleString from "../enum/UserRoleString";
import Validator from "../interfaces/Validator";
import User from "../models/User";
import UserService from "../services/UserService";
import ServiceError from "../utils/ServiceError";
import { pickBy } from "lodash";
import { isString, isBoolean, isObject } from "./Validators";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";

export interface AdditionalUserData {
  password1: string;
  /**
   * Password (typed again).
   */
  password2: string;
  deleted: boolean;
}

export type UserDataKey =
  | "username"
  | "name"
  | "email"
  | "screenName"
  | "residence"
  | "phone"
  | "password1"
  | "password2"
  | "isHYYMember"
  | "isHyStaff"
  | "isHyStudent"
  | "isTKTL";

export type UserDataKeyWithRole = UserDataKey | "role";
export type UserDataKeyWithMembership = UserDataKey | "membership";

// Self edit keys
export type SelfEditKey = UserDataKey;
// Jäsenvirkailija edit keys
export type JVDataKey = UserDataKey | "membership";
// Admin edit keys
export type AdminDataKey = "role" | "createdAt" | JVDataKey;

// Colums allowed to be self-edited
export const allowedSelfEdit: SelfEditKey[] = [
  "screenName",
  "email",
  "residence",
  "phone",
  "isHYYMember",
  "isTKTL",
  "password1",
  "password2",
  "isHyStaff",
  "isHyStudent",
];

// Colums allowed to be edited by jäsenvirkailija
export const allowedJVEdit: JVDataKey[] = [...allowedSelfEdit, "name", "username", "membership"];

// Colums allowed to be edited by admin
export const allowedAdminEdit: AdminDataKey[] = [...allowedJVEdit, "role", "createdAt"];

export type UserCreateModel = User & AdditionalUserData;
export type UserUpdateModel = Partial<User & AdditionalUserData> & Pick<User, "role">;

export type UserData = Pick<UserCreateModel, UserDataKey>;
export type UserDataWithRole = Pick<UserCreateModel, UserDataKeyWithRole>;
export type UserDataWithMembership = Pick<UserCreateModel, UserDataKeyWithMembership>;

// Keys of User creation POST request
export const userDataKeys: UserDataKey[] = [
  "username",
  "name",
  "email",
  "screenName",
  "residence",
  "phone",
  "password1",
  "password2",
  "isHYYMember",
  "isHyStaff",
  "isHyStudent",
  "isTKTL",
];

export const hasForeignKeys = (obj: object, ownKeys: UserDataKey[]) => {
  const keys = [...Object.keys(obj)].filter(key => ownKeys.find(ownKey => ownKey === key) === undefined);
  return keys.length > 0;
};

export const isValidPartialUser = (
  entity: unknown,
): entity is Partial<UserData | UserDataWithRole | UserDataWithMembership> => {
  if (!isObject(entity)) {
    return false;
  }
  if (hasForeignKeys(entity, userDataKeys)) {
    return false;
  }
  const u = entity as Partial<UserData | UserDataWithRole | UserDataWithMembership>;
  if (u.username !== undefined && !isString(u.username)) {
    return false;
  }
  if (u.name !== undefined && !isString(u.name)) {
    return false;
  }
  if (u.email !== undefined && !isString(u.email)) {
    return false;
  }
  if (u.screenName !== undefined && !isString(u.screenName)) {
    return false;
  }
  if (u.residence !== undefined && !isString(u.residence)) {
    return false;
  }
  if (u.phone !== undefined && !isString(u.phone)) {
    return false;
  }
  if (u.password1 !== undefined && !isString(u.password1)) {
    return false;
  }
  if (u.password2 !== undefined && !isString(u.password2)) {
    return false;
  }
  if (u.isHYYMember !== undefined && !isBoolean(u.isHYYMember)) {
    return false;
  }
  if (u.isHyStaff !== undefined && !isBoolean(u.isHyStaff)) {
    return false;
  }
  if (u.isHyStudent !== undefined && !isBoolean(u.isHyStudent)) {
    return false;
  }
  if (u.isTKTL !== undefined && !isBoolean(u.isTKTL)) {
    return false;
  }
  if ("role" in u) {
    if (u.role !== undefined && !isString(u.isTKTL)) {
      return false;
    }
  }
  if ("membership" in u) {
    if (u.membership !== undefined && !isString(u.membership)) {
      return false;
    }
  }
  return true;
};

export const isValidUser = (entity: unknown): entity is UserData => {
  if (!isObject(entity)) {
    return false;
  }
  if (hasForeignKeys(entity, userDataKeys)) {
    return false;
  }
  const u = entity as UserData;
  if (
    u.username === undefined ||
    u.name === undefined ||
    u.email === undefined ||
    u.screenName === undefined ||
    u.residence === undefined ||
    u.phone === undefined ||
    u.password1 === undefined ||
    u.password2 === undefined ||
    u.isHYYMember === undefined ||
    u.isHyStaff === undefined ||
    u.isHyStudent === undefined ||
    u.isTKTL === undefined
  ) {
    return false;
  }
  if (!isString(u.username)) {
    return false;
  }
  if (!isString(u.name)) {
    return false;
  }
  if (!isString(u.email)) {
    return false;
  }
  if (!isString(u.screenName)) {
    return false;
  }
  if (!isString(u.residence)) {
    return false;
  }
  if (!isString(u.phone)) {
    return false;
  }
  if (!isString(u.password1)) {
    return false;
  }
  if (!isString(u.password2)) {
    return false;
  }
  if (!isBoolean(u.isHYYMember)) {
    return false;
  }
  if (!isBoolean(u.isHyStaff)) {
    return false;
  }
  if (!isBoolean(u.isHyStudent)) {
    return false;
  }
  if (!isBoolean(u.isTKTL)) {
    return false;
  }
  return true;
};

export const checkEmailAvailability = async (email: string) => {
  const emailAvailable = await UserService.checkEmailAvailability(email);
  return emailAvailable;
};

export const checkEmailValidity = (email: string) => {
  if (
    !isEmail(email) ||
    !isLength(email, {
      max: 255,
      min: 1,
    })
  ) {
    return false;
  }

  return true;
};

const checkUsernameAvailability = async (username: string) => {
  // Test username
  const usernameAvailable = await UserService.checkUsernameAvailability(username.trim());
  return usernameAvailable;
};

const booleanToInt = (val: boolean): 1 | 0 => (!!val ? 1 : 0);

const stringsAreEqual = (str1: string, str2: string) => str1.trim().toLowerCase() === str2.trim().toLowerCase();

export default class UserValidator implements Validator<UserCreateModel, UserUpdateModel> {
  public async validateCreate(u: UserData) {
    const usernameAvailable = await checkUsernameAvailability(u.username);
    if (!usernameAvailable) {
      throw new ServiceError(400, "Username is already taken.");
    }

    // Test email
    if (!checkEmailValidity(u.email)) {
      throw new ServiceError(400, "Malformed email address.");
    }

    // Test email for taken
    const emailAvailable = await checkEmailAvailability(u.email);
    if (!emailAvailable) {
      throw new ServiceError(400, "Email address is already taken.");
    }

    if (!equals(u.password1, u.password2)) {
      throw new ServiceError(400, "Passwords do not match.");
    }

    return {
      user: new User({
        id: -1,
        username: u.username,
        name: u.name,
        email: u.email,
        screen_name: u.screenName,
        residence: u.residence,
        membership: "ei-jasen",
        role: UserRoleString.Kayttaja,
        phone: u.phone,
        tktl: booleanToInt(u.isTKTL),
        hy_staff: booleanToInt(u.isHyStaff),
        hy_student: booleanToInt(u.isHyStudent),
        hyy_member: booleanToInt(u.isHYYMember),
        deleted: 0,
        // These will be filled later
        created: new Date(),
        modified: new Date(),
        hashed_password: "",
        salt: "",
      }),
      password: u.password1,
    };
  }

  public async validateUpdate(
    userId: number,
    newData: Partial<
      UserData | UserDataWithRole | UserDataWithMembership | UserDataKeyWithRole & UserDataWithMembership
    >,
    modifiedBy: User,
  ) {
    let errors: string[] = [];
    const oldUser = await UserService.fetchUser(userId);
    if (
      newData.username !== undefined &&
      !stringsAreEqual(newData.username, modifiedBy.username) &&
      !stringsAreEqual(newData.username, oldUser.username)
    ) {
      const usernameAvailable = await checkUsernameAvailability(newData.username);

      if (!usernameAvailable) {
        errors = [...errors, "Username already taken"];
      }
    }

    // New email address
    if (newData.email !== undefined) {
      if (!checkEmailValidity(newData.email)) {
        errors = [...errors, "Email address is malformed"];
      }
      if (!stringsAreEqual(newData.email, oldUser.email)) {
        const emailAvailable = await checkEmailAvailability(newData.email);
        if (!emailAvailable) {
          errors = [...errors, "Email address is already taken"];
        }
      }
    }

    let updatedData: Partial<UserDatabaseObject> = {
      username: newData.username,
      name: newData.name,
      screen_name: newData.screenName,
      email: newData.email,
      residence: newData.residence,
      phone: newData.phone,
      hy_staff: newData.isHyStaff ? booleanToInt(newData.isHyStaff) : undefined,
      hy_student: newData.isHyStudent ? booleanToInt(newData.isHyStudent) : undefined,
      hyy_member: newData.isHYYMember ? booleanToInt(newData.isHYYMember) : undefined,
      tktl: newData.isTKTL ? booleanToInt(newData.isTKTL) : undefined,
    };

    if ("role" in newData) {
      updatedData.role = newData.role;
    }

    if ("membership" in newData) {
      updatedData.membership = newData.membership;
    }

    if (newData.password1 && newData.password2) {
      if (!equals(newData.password1, newData.password2)) {
        errors = [...errors, "Passwords do not match"];
      }
    }

    updatedData = { ...pickBy(updatedData, v => v !== undefined) };

    const error = "Forbidden modify action";
    if (userId === modifiedBy.id) {
      // Self edit
      console.log('self edit')
      updatedData.id = userId;
      checkModifyPermission(newData, allowedSelfEdit);
    } else if (userId !== modifiedBy.id && modifiedBy.role === UserRoleString.Jasenvirkailija) {
      // Jasenvirkailija edit
      checkModifyPermission(newData, allowedJVEdit);
    } else if (userId !== modifiedBy.id && modifiedBy.role === UserRoleString.Yllapitaja) {
      // Yllapitaja edit
      checkModifyPermission(newData, allowedAdminEdit);
    } else {
      throw new ServiceError(403, error);
    }

    if (errors.length > 0) {
      throw new ServiceError(400, "Validation errors: " + errors.join(", "));
    }

    return { ...updatedData };
  }
}

export function checkModifyPermission(
  user: Partial<UserDatabaseObject>,
  allowedEdits: SelfEditKey[] | JVDataKey[] | AdminDataKey[],
) {
  const error = "Forbidden modify action";
  Object.keys(user).forEach((key: keyof UserDatabaseObject) => {
    if (!allowedEdits.find(allowedEdit => allowedEdit === key) && key !== "id") {
      throw new ServiceError(403, error);
    }
  });
}

import UserRoleString from "../enum/UserRoleString";
import { RoleNumbers } from "../models/User";

export const stringToBoolean = (str: string | number | object | boolean) => {
  if (typeof str === "string") {
    if (str === "1" || str === "0") {
      return str === "1";
    } else if (str === "true" || str === "false") {
      return str === "true";
    }
  } else if (typeof str === "number") {
    if (str === 1 || str === 0) {
      return str === 1;
    }
  } else if (typeof str === "boolean") {
    return str;
  }
  return false;
};

export const compareRoles = (a: UserRoleString, b: UserRoleString) => {
  let aN = 0;
  let bN = 0;

  if (RoleNumbers[a]) {
    aN = RoleNumbers[a];
  }

  if (RoleNumbers[b]) {
    bN = RoleNumbers[b];
  }

  if (aN < bN) {
    return -1;
  } else if (aN > bN) {
    return 1;
  } else {
    return 0;
  }
};

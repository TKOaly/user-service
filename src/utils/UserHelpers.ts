import UserRoleString from "../enum/UserRoleString";
import { RoleNumbers } from "../models/User";

export function stringToBoolean(str: string | number | object | boolean): boolean {
  return str === "0" ? false : str === "false" ? false : str === "1" ? true : str === "true" ? true : false;
}

export function compareRoles(a: UserRoleString, b: UserRoleString): number {
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
}

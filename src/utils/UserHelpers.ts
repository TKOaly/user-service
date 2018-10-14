import { RoleNumbers } from "../models/User";
import UserRoleString from "../enum/UserRoleString";

/**
 * Converts a string representation to a boolean.
 *
 * @export
 * @param {*} str String representation
 * @returns {boolean} Boolean
 */
export function stringToBoolean(str: string | number | object | boolean): boolean {
  return str === "0"
    ? false
    : str === "false"
      ? false
      : str === "1"
        ? true
        : str === "true"
          ? true
          : false;
}

/**
 * Compares user roles.
 *
 * @export
 * @param {string} a Role a
 * @param {string} b Role b
 * @returns {number} Role difference
 */
export function compareRoles(a: UserRoleString, b: UserRoleString): number {
  let aN: number = 0;
  let bN: number = 0;

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

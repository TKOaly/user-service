import { roleNumbers } from "../models/User";

/**
 * Converts a string representation to a boolean.
 *
 * @export
 * @param {*} str String representation
 * @returns {boolean} Boolean
 */
export function stringToBoolean(str: any): boolean  {
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
export function compareRoles(a: string, b: string): number {
  let aN: number = 0;
  let bN: number = 0;

  if (roleNumbers[a]) {
    aN = roleNumbers[a];
  }

  if (roleNumbers[b]) {
    bN = roleNumbers[b];
  }

  if (aN < bN) {
    return -1;
  } else if (aN > bN) {
    return 1;
  } else {
    return 0;
  }
}

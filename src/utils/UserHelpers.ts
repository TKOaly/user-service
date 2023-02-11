import crypto from "node:crypto";
import bcrypt from "bcrypt";
import sha1 from "sha1";
import UserRoleString from "../enum/UserRoleString";
import { RoleNumbers } from "../models/User";

export const stringToBoolean = (str: unknown) => {
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

const preprocessPassword = (password: string): string =>
  crypto.createHash("sha256").update(password, "utf-8").digest("base64");

export const validatePasswordHashAsync = async (password: string, hash: string) => {
  const preprocessed = preprocessPassword(password);

  // PHP's password_hash generates $2y$ version bcrypt hashes, which in theory
  // at least are compatible with $2b$ hashes. Node-bcrypt supports $2a$ and
  // $2b$ hashes, so just string replace 2y -> 2b and the library is happy.
  // https://en.wikipedia.org/wiki/Bcrypt#Versioning_history
  const nodeBcryptCompatibleHash = hash.replace(/^\$2y\$/, "$2b$");
  return await bcrypt.compare(preprocessed, nodeBcryptCompatibleHash);
};

export const hashPasswordAsync = async (password: string) => {
  // Hashaa eka sha256:lla koska jos salasana on yli 72 tavua,
  // bcrypt käsittelee vain ekat 72 tavua.
  // tää on ihan ok, t:
  // https://crypto.stackexchange.com/questions/24993/is-there-a-way-to-use-bcrypt-with-passwords-longer-than-72-bytes-securely
  // https://security.stackexchange.com/questions/92175/what-are-the-pros-and-cons-of-using-sha256-to-hash-a-password-before-passing-it
  const preprocessed = preprocessPassword(password);

  const ROUNDS = 11;
  const hash = await bcrypt.hash(preprocessed, ROUNDS);
  // We don't need to do $2b$ -> $2y$ replacement here, because
  // PHP's password_hash seems to handle 2b hashes as well as 2y hashes
  // just fine.
  return hash;
};

export const hashPasswordSync = (password: string) => {
  // Hashaa eka sha256:lla koska jos salasana on yli 72 tavua,
  // bcrypt käsittelee vain ekat 72 tavua.
  // tää on ihan ok, t:
  // https://crypto.stackexchange.com/questions/24993/is-there-a-way-to-use-bcrypt-with-passwords-longer-than-72-bytes-securely
  // https://security.stackexchange.com/questions/92175/what-are-the-pros-and-cons-of-using-sha256-to-hash-a-password-before-passing-it
  const preprocessed = crypto.createHash("sha256").update(password, "utf-8").digest("base64");

  const ROUNDS = 11;
  const hash = bcrypt.hashSync(preprocessed, ROUNDS);
  return hash;
};

export const legacyHashPassword = (password: string, salt: string) => sha1(salt + "kekbUr" + password);

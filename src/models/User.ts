/**
 * User object.
 *
 * @export
 * @class User
 */
export default class User {
  /**
   * User id
   *
   * @type {number}
   * @memberof User
   */
  id: number;
  /**
   * Username
   *
   * @type {string}
   * @memberof User
   */
  username: string;
  /**
   * Name
   *
   * @type {string}
   * @memberof User
   */
  name: string;
  /**
   * Screen name
   *
   * @type {string}
   * @memberof User
   */
  screenName: string;
  /**
   * Email
   *
   * @type {string}
   * @memberof User
   */
  email: string;
  /**
   * Residence
   *
   * @type {string}
   * @memberof User
   */
  residence: string;
  /**
   * Phone
   *
   * @type {string}
   * @memberof User
   */
  phone: string;
  /**
   * Is the user a HYY member or not
   *
   * @type {boolean}
   * @memberof User
   */
  isHYYMember: boolean;
  /**
   * Membership status
   *
   * @type {string}
   * @memberof User
   */
  membership: string;
  /**
   * Role
   *
   * @type {string}
   * @memberof User
   */
  role: string;
  /**
   * Salt
   *
   * @type {string}
   * @memberof User
   */
  salt: string;
  /**
   * Password hash (sha1 or BCrypt)
   *
   * @type {string}
   * @memberof User
   */
  hashedPassword: string;
  /**
   * Date when the user was created at.
   *
   * @type {Date}
   * @memberof User
   */
  createdAt: Date;
  /**
   * Date when the user was last modified.
   *
   * @type {Date}
   * @memberof User
   */
  modifiedAt: Date;
  /**
   * Is the user a TKTL member or not.
   *
   * @type {boolean}
   * @memberof User
   */
  isTKTL: boolean;
  /**
   * Is the user deleted or not.
   *
   * @type {boolean}
   * @memberof User
   */
  isDeleted: boolean;

  /**
   * Creates an instance of User.
   * @param {UserDatabaseObject} userDatabaseObject User database object
   * @memberof User
   */
  constructor(userDatabaseObject: UserDatabaseObject) {
    this.id = userDatabaseObject.id;
    this.username = userDatabaseObject.username;
    this.name = userDatabaseObject.name;
    this.screenName = userDatabaseObject.screen_name;
    this.email = userDatabaseObject.email;
    this.residence = userDatabaseObject.residence;
    this.phone = userDatabaseObject.phone;
    this.isHYYMember =
      userDatabaseObject.hyy_member == null
        ? undefined
        : Boolean(userDatabaseObject.hyy_member);
    this.membership = userDatabaseObject.membership;
    this.role = userDatabaseObject.role;
    this.salt = userDatabaseObject.salt;
    this.hashedPassword = userDatabaseObject.hashed_password;
    this.createdAt = userDatabaseObject.created;
    this.modifiedAt = userDatabaseObject.modified;
    this.isTKTL =
      userDatabaseObject.tktl == null
        ? undefined
        : Boolean(userDatabaseObject.tktl);
    this.isDeleted =
      userDatabaseObject.deleted == null
        ? undefined
        : Boolean(userDatabaseObject.deleted);
  }

  /**
   * Removes sensitive information from a user.
   *
   * @returns User object with sensitive information removed
   * @memberof User
   */
  removeSensitiveInformation() {
    delete this.salt;
    delete this.hashedPassword;
    return this;
  }

  /**
   * Removes non-requested user data.
   *
   * @param {number} dataRequest Data request number
   * @returns
   * @memberof User User with non-requested data removed
   */
  removeNonRequestedData(dataRequest: number): User {
    Object.keys(this.removeSensitiveInformation()).forEach(
      (key: string, i: number) => {
        let val = Math.pow(2, i);
        if (val == null || (val & dataRequest) != val) delete this[key];
      }
    );
    return this;
  }

  /**
   * Returns a database object.
   *
   * @returns {UserDatabaseObject} User database object
   * @memberof User
   */
  getDatabaseObject(): UserDatabaseObject {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      screen_name: this.screenName,
      email: this.email,
      residence: this.residence,
      phone: this.phone,
      hyy_member: this.isHYYMember,
      membership: this.membership,
      role: this.role,
      salt: this.salt,
      hashed_password: this.hashedPassword,
      created: this.createdAt || new Date(),
      modified: new Date(),
      deleted: this.isDeleted
    };
  }
}

/**
 * User database object.
 *
 * @interface UserDatabaseObject
 */
interface UserDatabaseObject {
  id?: number;
  username?: string;
  name?: string;
  screen_name?: string;
  email?: string;
  residence?: string;
  phone?: string;
  hyy_member?: number | boolean;
  membership?: string;
  role?: string;
  salt?: string;
  hashed_password?: string;
  created?: Date;
  modified?: Date;
  tktl?: number | boolean;
  deleted?: number | boolean;
}

export function compareRoles(a: string, b: string) {
  const roleNumbers = {
    kayttaja: 1,
    virkailija: 2,
    tenttiarkistovirkailija: 2,
    jasenvirkailija: 3,
    yllapitaja: 4
  };

  let aN = 0;
  let bN = 0;

  if (roleNumbers[a]) aN = roleNumbers[a];

  if (roleNumbers[b]) bN = roleNumbers[b];

  if (aN < bN) return -1;
  else if (aN > bN) return 1;
  else return 0;
}

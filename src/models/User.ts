import IUserRoles from "../interfaces/IUserRoles";

import IUserDatabaseObject from "../interfaces/IUserDatabaseObject";

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
  public id: number;
  /**
   * Username
   *
   * @type {string}
   * @memberof User
   */
  public username: string;
  /**
   * Name
   *
   * @type {string}
   * @memberof User
   */
  public name: string;
  /**
   * Screen name
   *
   * @type {string}
   * @memberof User
   */
  public screenName: string;
  /**
   * Email
   *
   * @type {string}
   * @memberof User
   */
  public email: string;
  /**
   * Residence
   *
   * @type {string}
   * @memberof User
   */
  public residence: string;
  /**
   * Phone
   *
   * @type {string}
   * @memberof User
   */
  public phone: string;
  /**
   * Is the user a HYY member or not
   *
   * @type {boolean}
   * @memberof User
   */
  public isHYYMember: boolean;
  /**
   * Membership status
   *
   * @type {string}
   * @memberof User
   */
  public membership: string;
  /**
   * Role
   *
   * @type {string}
   * @memberof User
   */
  public role: string;
  /**
   * Salt
   *
   * @type {string}
   * @memberof User
   */
  public salt: string;
  /**
   * Password hash (sha1 or BCrypt)
   *
   * @type {string}
   * @memberof User
   */
  public hashedPassword: string;
  /**
   * Date when the user was created at.
   *
   * @type {Date}
   * @memberof User
   */
  public createdAt: Date;
  /**
   * Date when the user was last modified.
   *
   * @type {Date}
   * @memberof User
   */
  public modifiedAt: Date;
  /**
   * Is the user a TKTL member or not.
   *
   * @type {boolean}
   * @memberof User
   */
  public isTKTL: boolean;
  /**
   * Is the user deleted or not.
   *
   * @type {boolean}
   * @memberof User
   */
  public isDeleted: boolean;

  /**
   * Creates an instance of User.
   * @param {IUserDatabaseObject} userDatabaseObject User database object
   * @memberof User
   */
  constructor(userDatabaseObject: IUserDatabaseObject) {
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
  public removeSensitiveInformation(): User {
    delete this.salt;
    delete this.hashedPassword;
    return this;
  }

  /**
   * Removes non-requested user data.
   *
   * @param {number} dataRequest Data request export number
   * @returns
   * @memberof User User with non-requested data removed
   */
  public removeNonRequestedData(dataRequest: number): User {
    Object.keys(this.removeSensitiveInformation()).forEach(
      (key: string, i: number) => {
        const val: number = Math.pow(2, i);
        if (val === null || (val & dataRequest) !== val) {
          delete this[key];
        }
      }
    );
    return this;
  }

  /**
   * Returns a database object.
   *
   * @returns {IUserDatabaseObject} User database object
   * @memberof User
   */
  public getDatabaseObject(): IUserDatabaseObject {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      screen_name: this.screenName,
      email: this.email,
      residence: this.residence,
      phone: this.phone,
      hyy_member: isNaN(Number(this.isHYYMember))
        ? undefined
        : Number(this.isHYYMember),
      tktl: isNaN(Number(this.isTKTL)) ? undefined : Number(this.isTKTL),
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

export const roleNumbers: IUserRoles = {
  kayttaja: 1,
  virkailija: 2,
  tenttiarkistovirkailija: 2,
  jasenvirkailija: 3,
  yllapitaja: 4
};

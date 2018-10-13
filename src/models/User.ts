import IUserDatabaseObject from "../interfaces/IUserDatabaseObject";
import UserRoleString from "../enum/UserRoleString";

export default class User {

  public id: number;

  public username: string;

  public name: string;

  public screenName: string;

  public email: string;

  public residence: string;

  public phone: string;

  public isHYYMember: boolean;

  /**
   * Membership status
   */
  public membership: string;

  public role: UserRoleString;

  public salt: string;

  /**
   * Password hash (sha1 or BCrypt)
   */
  public hashedPassword: string;

  public createdAt: Date;

  public modifiedAt: Date;

  /**
   * Is the user a TKTL member or not.
   */
  public isTKTL: boolean;

  public isDeleted: boolean;

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
    this.role = userDatabaseObject.role as UserRoleString;
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

  public removeSensitiveInformation(): User {
    delete this.salt;
    delete this.hashedPassword;
    return this;
  }

  public removeNonRequestedData(dataRequest: number): User {
    Object.keys(this.removeSensitiveInformation()).forEach(
      (key: keyof User, i: number) => {
        const val: number = Math.pow(2, i);
        if (val === null || (val & dataRequest) !== val) {
          delete this[key];
        }
      }
    );
    return this;
  }

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
      created: this.createdAt,
      modified: this.modifiedAt,
      deleted: this.isDeleted
    };
  }
}

export const RoleNumbers: Record<UserRoleString, number> = {
  kayttaja: 1,
  virkailija: 2,
  tenttiarkistovirkailija: 2,
  jasenvirkailija: 3,
  yllapitaja: 4
};

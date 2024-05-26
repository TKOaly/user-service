import UserRoleString from "../enum/UserRoleString";
import UserDatabaseObject from "../interfaces/UserDatabaseObject";

export default class User {
  public id: number;
  public username: string;
  public name: string;
  public screenName: string;
  public email: string;
  public residence: string;
  public phone: string;
  public isHYYMember: boolean;
  public membership: string;

  public role: UserRoleString;
  /**
   * @deprecated Legacy, pending removal.
   */
  public salt: string;
  /**
   * Password hash (sha1).
   * @deprecated Legacy, pending removal.
   */
  public hashedPassword: string;
  /**
   * Password hash (bcrypt)
   */
  public passwordHash: string;
  public createdAt: Date;
  public modifiedAt: Date;
  public isTKTL: boolean;
  public isDeleted: boolean;
  public isHyStaff: boolean;
  public isHyStudent: boolean;
  public isTKTDTStudent: boolean;

  constructor(userDatabaseObject: UserDatabaseObject) {
    this.id = userDatabaseObject.id;
    this.username = userDatabaseObject.username;
    this.name = userDatabaseObject.name;
    this.screenName = userDatabaseObject.screen_name;
    this.email = userDatabaseObject.email;
    this.residence = userDatabaseObject.residence;
    this.phone = userDatabaseObject.phone;
    this.isHYYMember = userDatabaseObject.hyy_member === 1;
    this.membership = userDatabaseObject.membership;
    this.role = userDatabaseObject.role as UserRoleString;
    this.salt = userDatabaseObject.salt;
    this.hashedPassword = userDatabaseObject.hashed_password;
    this.passwordHash = userDatabaseObject.password_hash;
    this.createdAt = userDatabaseObject.created;
    this.modifiedAt = userDatabaseObject.modified;
    this.isTKTL = userDatabaseObject.tktl === 1;
    this.isDeleted = userDatabaseObject.deleted === 1;
    this.isHyStaff = userDatabaseObject.hy_staff === 1;
    this.isHyStudent = userDatabaseObject.hy_student === 1;
    this.isTKTDTStudent = userDatabaseObject.tktdt_student === 1;
  }

  public removeSensitiveInformation(): User {
    // @ts-expect-error
    delete this.salt; // @ts-expect-error
    delete this.hashedPassword; // @ts-expect-error
    delete this.passwordHash;
    return this;
  }

  /**
   * Removes non-requested user data.
   */
  public removeNonRequestedData(dataRequest: number): Partial<User> {
    // @ts-expect-error
    Object.keys(this.removeSensitiveInformation()).forEach((key: keyof User, i) => {
      const val: number = Math.pow(2, i);
      if (val === null || (val & dataRequest) !== val) {
        delete this[key];
      }
    });
    return this;
  }

  public getDatabaseObject(): UserDatabaseObject {
    return {
      id: this.id,
      username: this.username,
      name: this.name,
      screen_name: this.screenName,
      email: this.email,
      residence: this.residence,
      phone: this.phone,
      hyy_member: this.isHYYMember ? 1 : 0,
      tktl: this.isTKTL ? 1 : 0,
      membership: this.membership,
      role: this.role,
      salt: this.salt,
      hashed_password: this.hashedPassword,
      password_hash: this.passwordHash,
      created: this.createdAt,
      modified: this.modifiedAt,
      deleted: this.isDeleted ? 1 : 0,
      hy_staff: this.isHyStaff ? 1 : 0,
      hy_student: this.isHyStudent ? 1 : 0,
      tktdt_student: this.isTKTDTStudent ? 1 : 0,
    };
  }
}

export const RoleNumbers: Record<UserRoleString, number> = {
  kayttaja: 1,
  virkailija: 2,
  tenttiarkistovirkailija: 2,
  jasenvirkailija: 3,
  yllapitaja: 4,
};

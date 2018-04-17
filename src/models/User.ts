export class User {
  id: number;
  username: string;
  name: string;
  screenName: string;
  email: string;
  residence: string;
  phone: string;
  isHYYMember: boolean;
  membership: string;
  role: string;
  salt: string;
  hashedPassword: string;
  createdAt: Date;
  modifiedAt: Date;
  isTKTL: boolean;
  isDeleted: boolean;

  constructor(userDatabaseObject: any) {
    this.id = userDatabaseObject.id;
    this.username = userDatabaseObject.username;
    this.name = userDatabaseObject.name;
    this.screenName = userDatabaseObject.screen_name;
    this.email = userDatabaseObject.email;
    this.residence = userDatabaseObject.residence;
    this.phone = userDatabaseObject.phone;
    this.isHYYMember = userDatabaseObject.hyy_member == 1 ? true : false;
    this.membership = userDatabaseObject.memership;
    this.role = userDatabaseObject.role;
    this.salt = userDatabaseObject.salt;
    this.hashedPassword = userDatabaseObject.hashed_password;
    this.createdAt = userDatabaseObject.created;
    this.modifiedAt = userDatabaseObject.modified;
    this.isTKTL = userDatabaseObject.tktl == 1 ? true : false;
    this.isDeleted = userDatabaseObject.deleted == 1 ? true : false;
  }

  removeSensitiveInformation() {
    delete this.salt;
    delete this.hashedPassword;
    return this;
  }

  removeNonRequestedData(dataRequest: number) {
    Object.keys(this.removeSensitiveInformation()).forEach((key, i) => {
      let val = Math.pow(2, i);
      if (val == null || (val & dataRequest) != val)
        delete this[key];
    });
    return this;
  }
}
class User {
  constructor(userDatabaseObject) {
    this.id = userDatabaseObject.id;
    this.username = userDatabaseObject.username;
    this.name = userDatabaseObject.name;
    this.screenName = userDatabaseObject.screen_name;
    this.email = userDatabaseObject.email;
    this.residence = userDatabaseObject.residence;
    this.phone = userDatabaseObject.phone;
    this.isHYYMember = userDatabaseObject.hyy_member == 1 ? true : false;
    this.memership = userDatabaseObject.memership;
    this.role = userDatabaseObject.role;
    this.createdAt = userDatabaseObject.created;
    this.modifiedAt = userDatabaseObject.modified;
    this.isTKTL = userDatabaseObject.tktl == 1 ? true : false;
    this.isDeleted = userDatabaseObject.deleted == 1 ? true : false;
  }
}

module.exports = User;
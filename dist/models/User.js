"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
}
exports.default = User;
//# sourceMappingURL=User.js.map
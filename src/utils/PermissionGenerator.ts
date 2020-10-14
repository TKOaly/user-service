import UserDatabaseObject from "../interfaces/UserDatabaseObject";

class PermissionGenerator {
  private PermissionModel: Record<keyof UserDatabaseObject, number> = {
    created: Math.pow(2, 0),
    deleted: Math.pow(2, 1),
    email: Math.pow(2, 2),
    hashed_password: Math.pow(2, 3),
    hyy_member: Math.pow(2, 4),
    id: Math.pow(2, 5),
    membership: Math.pow(2, 6),
    modified: Math.pow(2, 7),
    name: Math.pow(2, 8),
    phone: Math.pow(2, 9),
    residence: Math.pow(2, 10),
    role: Math.pow(2, 11),
    salt: Math.pow(2, 12),
    screen_name: Math.pow(2, 13),
    tktl: Math.pow(2, 14),
    username: Math.pow(2, 15),
    hy_staff: Math.pow(2, 16),
    hy_student: Math.pow(2, 16),
  };

  private PermissionByte = 0;
  private PermissionList: Array<keyof UserDatabaseObject> = [];
  constructor(permissionByte?: number, permissionList?: Array<keyof UserDatabaseObject>) {
    if (permissionByte !== undefined && permissionList !== undefined) {
      this.PermissionByte = permissionByte;
      this.PermissionList = permissionList;
    }
  }

  public createdAt() {
    return this.helper("created");
  }

  public deleted() {
    return this.helper("deleted");
  }

  public email() {
    return this.helper("email");
  }

  public hashedPassword() {
    return this.helper("hashed_password");
  }

  public hyyMember() {
    return this.helper("hyy_member");
  }

  public id() {
    return this.helper("id");
  }

  public membership() {
    return this.helper("membership");
  }

  public modified() {
    return this.helper("modified");
  }

  public name() {
    return this.helper("name");
  }

  public phone() {
    return this.helper("phone");
  }

  public residence() {
    return this.helper("residence");
  }

  public role() {
    return this.helper("role");
  }

  public salt() {
    return this.helper("salt");
  }

  public screenName() {
    return this.helper("screen_name");
  }

  public tktl() {
    return this.helper("tktl");
  }

  public hyStudent() {
    return this.helper("hy_student");
  }

  public hyStaff() {
    return this.helper("hy_staff");
  }

  public username() {
    return this.helper("username");
  }

  public getValue() {
    return this.PermissionByte;
  }

  public getFields() {
    return [...this.PermissionList].sort();
  }

  public all() {
    let newGenerator = new PermissionGenerator(this.PermissionByte, this.PermissionList);
    Object.keys(newGenerator.PermissionModel).forEach(
      // @ts-expect-error
      (key: keyof UserDatabaseObject) => (newGenerator = newGenerator.helper(key)),
    );
    return newGenerator;
  }

  private helper(key: keyof UserDatabaseObject) {
    const newGenerator = new PermissionGenerator(this.PermissionByte, this.PermissionList);
    if (!newGenerator.PermissionList.find(elem => key === elem)) {
      newGenerator.PermissionList = [...newGenerator.PermissionList, key];
    }
    if ((newGenerator.PermissionModel[key] & newGenerator.PermissionByte) !== newGenerator.PermissionModel[key]) {
      newGenerator.PermissionByte = newGenerator.PermissionByte | newGenerator.PermissionModel[key];
    }

    return newGenerator;
  }
}

export default PermissionGenerator;

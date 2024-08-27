import UserRoleString from "../src/enum/UserRoleString";
import UserDatabaseObject from "../src/interfaces/UserDatabaseObject";
import User from "../src/models/User";
import UserService from "../src/services/UserService";
import arg from "arg";
import moment from "moment";

const parseArgs = () =>
  arg({
    "--id": Number,
    "--username": String,
    "--name": String,
    "--role": String,
    "--screen-name": String,
    "--email": String,
    "--residence": String,
    "--phone": String,
    "--password": String,
    "--membership": String,
    "--created-at": String,
    "--is-tktl": Boolean,
    "--is-hy-staff": Boolean,
    "--is-hy-student": Boolean,
    "--is-hyy-member": Boolean,
    "--is-tktdt-student": Boolean,
    "--wait": Boolean,
  });

const main = async () => {
  const args = parseArgs();

  const required = <S extends keyof typeof args>(arg: S): NonNullable<(typeof args)[S]> => {
    const value = args[arg];
    if (!value) throw new Error(`Argument ${arg} is required!`);
    return value;
  };

  const username = required("--username");
  const name = required("--name");
  const screen_name = args["--screen-name"] ?? name;
  const email = required("--email");
  const phone = required("--phone");
  const residence = required("--residence");
  const password = required("--password");

  if (!args["--username"]) throw new Error("Argument --username is required!");

  const created = args["--created-at"] ? moment(args["--created-at"], "YYYY-MM-DD").toDate() : new Date();

  await UserService.createUser(
    new User({
      username,
      name,
      screen_name,
      email,
      phone,
      residence,
      hyy_member: args["--is-hyy-member"] ? 1 : 0,
      hy_staff: args["--is-hy-staff"] ? 1 : 0,
      hy_student: args["--is-hy-student"] ? 1 : 0,
      tktdt_student: args["--is-tktdt-student"] ? 1 : 0,
      tktl: args["--is-tktl"] ? 1 : 0,
      role: (args["--role"] as UserRoleString | undefined) ?? UserRoleString.Kayttaja,
      membership: args["--membership"] ?? "ei-jasen",
      created,
      salt: "",
      hashed_password: "",
      password_hash: "",
      last_seq: 0,
      deleted: 0,
      modified: new Date(),
      id: args["--id"],
    } as UserDatabaseObject),
    password,
    !!args["--wait"],
  );

  process.exit(0);
};

main();

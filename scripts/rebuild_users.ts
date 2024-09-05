import arg from "arg";
import UserService from "../src/services/UserService";
import { isUserDatabaseObjectKey } from "../src/interfaces/UserDatabaseObject";

const parseArgs = () =>
  arg({
    "--allow-field": [String],
    "--allow-all-fields": Boolean,
    "--allow-create": Boolean,
    "--allow-delete": Boolean,
    "--help": Boolean,

    "-h": "--help",
  });

const printHelp = () => {
  console.log("Usage: pnpm rebuild-users [--allow-create] [--allow-delete]");
  console.log("  [--allow-all-fields] [--allow-field=<FIELD>]...");
  console.log();
  console.log("Rebuilds the users table from scratch based on NATS messages.");
  console.log();
  console.log("Calling this script with no options does not permit any changes");
  console.log("and is essentially equivalent to a dry-run. You can explicitly");
  console.log("allow wanted changes with the options listed below.");
  console.log();
  console.log("Options:");
  console.log("  --allow-create          Allow creation of new users");
  console.log("  --allow-delete          Allow deletion of existing users");
  console.log("  --allow-all-fields      Allow changes to all fields");
  console.log("  --allow-field=<FIELD>   Allow changes to the specified field");
};

async function main() {
  const args = parseArgs();

  if (args["--help"]) {
    printHelp();
    process.exit(0);
  }

  let allowChanges: NonNullable<Parameters<typeof UserService.rebuild>[0]>["allowChanges"] = [];

  if (args["--allow-all-fields"]) {
    allowChanges = undefined;
  } else {
    for (const field of args["--allow-field"] ?? []) {
      if (!isUserDatabaseObjectKey(field)) {
        console.log(`Field ${field} does not exist!`);
        process.exit(1);
      } else {
        allowChanges.push(field);
      }
    }
  }

  await UserService.rebuild({
    allowCreate: args["--allow-create"] ?? false,
    allowRemove: args["--allow-delete"] ?? false,
    allowChanges,
  });

  process.exit(0);
}

main();

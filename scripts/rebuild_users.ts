import UserService from "../src/services/UserService";

async function main() {
  await UserService.rebuild();
  process.exit(0);
}

main();

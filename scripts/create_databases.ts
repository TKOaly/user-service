// This script creates databases that are needed by the user service.

require("dotenv").config();

import { createConnection } from "mysql2/promise";

const dbName: string = process.env.DB_NAME;

async function createTables() {
  // Create connection
  console.log("Creating connection..");
  const con = await createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  console.log("Connection created.");

  try {
    // Create databases
    console.log("Creating production database named %s", dbName);
    await con.execute(
      "CREATE DATABASE IF NOT EXISTS " +
        dbName +
        " DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci"
    );
    console.log("Creating staging database named %s", dbName + "_staging");
    await con.execute(
      "CREATE DATABASE IF NOT EXISTS " +
        dbName +
        "_staging" +
        " DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci"
    );
    console.log("Creating development database named %s", dbName + "_dev");
    await con.execute(
      "CREATE DATABASE IF NOT EXISTS " +
        dbName +
        "_dev" +
        " DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci"
    );

    console.log("Creating testing database named %s", dbName + "_test");
    await con.execute(
      "CREATE DATABASE IF NOT EXISTS " +
        dbName +
        "_test" +
        " DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci"
    );
    console.log("Created development, test, stating and production databases.");
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}

// Run script
createTables();

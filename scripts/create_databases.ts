// This script creates databases that are needed by the user service.
import * as dotenv from "dotenv";
dotenv.config();

import { createConnection } from "mysql2/promise";

const dbName: string = process.env.DB_NAME;

async function createTables(): Promise<void> {
  // Create connection
  console.log("Creating connection..");
  const con = await createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  console.log("Connection created.");

  try {
    // Create databases
    const environments = ["test", "dev", "staging"];
    for (const env of environments) {
      const currentDbName = `${dbName}_${env}`;
      console.log("Creating database %s", currentDbName);
      await con.execute(
        `CREATE DATABASE ${currentDbName} IF NOT EXISTS  DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_unicode_ci`,
      );
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}

// Run script
createTables();

import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be specified.");
} else {
  const envs: string[] = ["development", "test", "production", "staging"];
  if (!(envs.indexOf(process.env.NODE_ENV) > -1)) {
    throw new Error(
      "NODE_ENV is set to an invalid value. It should be either development, test, production or staging.",
    );
  }
}

import * as Knex from "knex";

export const production: Knex.Config = {
  dialect: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "do_not_seed_prod_db",
  },
};

export const staging: Knex.Config = {
  dialect: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + "_staging",
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};
export const development: Knex.Config = {
  dialect: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + "_dev",
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};

export const test: Knex.Config = {
  dialect: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + "_test",
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};

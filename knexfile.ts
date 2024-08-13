import dotenv from "dotenv";
dotenv.config();

import { Knex } from "knex";
import { EsmFsMigrationSource, EsmFsSeedSource } from "./knex-esm-compat";

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be specified.");
} else {
  const envs = ["development", "test", "production", "staging"];
  if (!(envs.indexOf(process.env.NODE_ENV) > -1)) {
    throw new Error(
      "NODE_ENV is set to an invalid value. It should be either development, test, production or staging.",
    );
  }
}

if (
  process.env.DB_HOST === undefined ||
  process.env.DB_PORT === undefined ||
  process.env.DB_USER === undefined ||
  process.env.DB_PASSWORD === undefined ||
  process.env.DB_HOST === undefined ||
  process.env.DB_NAME === undefined
) {
  throw new Error("Database configuration is invalid, please set all environment variables!");
}

export const production: Knex.Config = {
  client: "mysql2",
  version: "5.7",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    migrationSource: new EsmFsMigrationSource(),
  },
  seeds: {
    directory: "do_not_seed_prod_db",
    seedSource: new EsmFsSeedSource(),
  },
};

export const staging: Knex.Config = {
  client: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    migrationSource: new EsmFsMigrationSource(),
  },
  seeds: {
    seedSource: new EsmFsSeedSource(),
  },
};

export const development: Knex.Config = {
  client: "mysql2",
  version: "5.7",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    migrationSource: new EsmFsMigrationSource(),
  },
  seeds: {
    seedSource: new EsmFsSeedSource(),
  },
};

export const test: Knex.Config = {
  client: "mysql2",
  version: "5.5",
  connection: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + "_test",
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    migrationSource: new EsmFsMigrationSource(),
  },
  seeds: {
    seedSource: new EsmFsSeedSource(),
  },
};

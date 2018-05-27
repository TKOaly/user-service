// Update with your config settings.

require("dotenv").config();

const prod = {
  client: "mysql2",
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations"
  }
};
const staging = {
  client: "mysql2",
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME + "_staging"
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations"
  }
};
const dev = {
  client: "mysql2",
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME + "_dev"
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations"
  }
};

const test = {
  client: "mysql2",
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME + "_test"
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations"
  }
};

module.exports = {
  development: dev,
  staging: staging,
  production: prod,
  test: test
};

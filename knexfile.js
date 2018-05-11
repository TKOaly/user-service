// Update with your config settings.

require('dotenv').config(); 

const mysql = {
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
}

module.exports = {
  development: mysql,
  staging: mysql,
  production: mysql,
  test: mysql
};

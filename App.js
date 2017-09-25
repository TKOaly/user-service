const express = require('express');
const bp = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bp.json());
app.use(bp.urlencoded());

const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME
  }
});

const AuthenticationService = require('./src/services/AuthenticationService');
const authenticationService = new AuthenticationService(knex);

const UserService = require('./src/services/UserService');
const userService = new UserService(knex);


// Routes
const authController = require('./src/controllers/AuthController')(authenticationService);
const userController = require('./src/controllers/UserController')(userService);

app.use('/api/auth', authController);
app.use('/api/users', userController);

app.listen(3000);
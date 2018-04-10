require('dotenv').config();
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as Knex from 'knex';
import AuthController from './controllers/AuthController';
import AuthenticationService from './services/AuthenticationService';
import UserController from './controllers/UserController';
import UserService from './services/UserService';

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

const knex = Knex({
  client: 'mysql2',
  connection: {
    host: process.env.AUTHSERVICE_DB_HOST,
    port: process.env.AUTHSERVICE_DB_PORT,
    user: process.env.AUTHSERVICE_DB_USER,
    password: process.env.AUTHSERVICE_DB_PASSWORD,
    database: process.env.AUTHSERVICE_DB_NAME
  }
});

let authService = new AuthenticationService(knex);

// Routes
const authController = new AuthController(authService);
let userController = new UserController(new UserService(knex), authService);

app.use('/api/auth', authController.createRoutes());
app.use('/api/users', userController.createRoutes());

app.listen(3000);
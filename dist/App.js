"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const Knex = require("knex");
const AuthController_1 = require("./controllers/AuthController");
const AuthenticationService_1 = require("./services/AuthenticationService");
const UserController_1 = require("./controllers/UserController");
const UserService_1 = require("./services/UserService");
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
let authService = new AuthenticationService_1.default(knex);
const authController = new AuthController_1.default(authService);
let userController = new UserController_1.default(new UserService_1.default(knex), authService);
app.use('/api/auth', authController.createRoutes());
app.use('/api/users', userController.createRoutes());
app.listen(3000);
//# sourceMappingURL=App.js.map
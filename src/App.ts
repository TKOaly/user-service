require("dotenv").config();
import * as express from "express";
import * as bodyParser from "body-parser";
import * as Knex from "knex";
import AuthController from "./controllers/AuthController";
import { AuthenticationService } from "./services/AuthenticationService";
import UserController from "./controllers/UserController";
import UserService from "./services/UserService";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

const knexfile = require("./../knexfile");

const knex = Knex(knexfile[process.env.NODE_ENV || 'staging']);

let authService = new AuthenticationService(knex);

// Routes
const authController = new AuthController(authService);
let userController = new UserController(new UserService(knex), authService);

app.use("/api/auth", authController.createRoutes());
app.use("/api/users", userController.createRoutes());

app.listen(3000);

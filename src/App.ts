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

app.use(express.static('./public'));
app.set('views', './public/views');
app.set('view engine', 'pug');


const knexfile = require("./../knexfile");

const knex = Knex(knexfile[process.env.NODE_ENV || 'staging']);

let authService = new AuthenticationService(knex);
let userService = new UserService(knex);

// Routes
const authController = new AuthController(authService, userService);
let userController = new UserController(userService, authService);

app.use("/api/auth", authController.createRoutes());
app.use("/api/users", userController.createRoutes());

app.listen(3000);

require("dotenv").config();

import * as express from "express";
import * as bodyParser from "body-parser";
import * as Knex from "knex";
import AuthController from "./controllers/AuthController";
import { AuthenticationService } from "./services/AuthenticationService";
import UserController from "./controllers/UserController";
import UserService from "./services/UserService";
import * as session from "express-session";
import * as cookieParser from "cookie-parser";
import Service from "./models/Service";
import LoginController from "./controllers/LoginController";
import UserDao from "./dao/UserDao";
import ServiceDao from "./dao/ServiceDao";

const app = express();

// Body parser
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(cookieParser());
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: "auto", maxAge: 60000 }
  })
);

// Set static folder
app.use(express.static("./public"));
// Set views folder
app.set("views", "./public/views");
// Set view engine
app.set("view engine", "pug");

// Knexfile
const knexfile = require("./../knexfile");

// Knex instance
const knex = Knex(knexfile[process.env.NODE_ENV || "staging"]);

// Auth & user service
const authService = new AuthenticationService(
  new UserDao(knex),
  new ServiceDao(knex)
);
const userService = new UserService(new UserDao(knex));

// Routes
const authController = new AuthController(authService, userService);
const userController = new UserController(userService, authService);
const loginController = new LoginController(authService, userService);

// API routes
app.use("/api/auth", authController.createRoutes());
app.use("/api/users", userController.createRoutes());
app.use("/", loginController.createRoutes());

// Start server
app.listen(process.env.USERSERVICE_PORT || 3000, () => {
  console.log(
    "User service listening on port %d",
    process.env.USERSERVICE_PORT || 3000
  );
});

process.on("SIGINT", () => {
  console.log("Caught interrupt signal, server stopped");
  process.exit();
});

export default app;

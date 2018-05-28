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
import LoginController from "./controllers/LoginController";
import UserDao from "./dao/UserDao";
import ServiceDao from "./dao/ServiceDao";
import { generateApiRoute } from "./utils/ApiRoute";
import PaymentService from "./services/PaymentService";
import PaymentDao from "./dao/PaymentDao";
import PaymentController from "./controllers/PaymentController";

const app: express.Application = express();

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
const knex: Knex = Knex(knexfile[process.env.NODE_ENV || "staging"]);

// Initialize services here

// User service
const userService: UserService = new UserService(new UserDao(knex));

// Payment service
const paymentService: PaymentService = new PaymentService(new PaymentDao(knex));

// Authentication service
const authService: AuthenticationService = new AuthenticationService(
  new ServiceDao(knex)
);

// Initialize controllers here

// Authentication controller
const authController: AuthController = new AuthController(
  userService,
  authService
);

// User controller
const userController: UserController = new UserController(
  userService,
  authService
);

// Login controller
const loginController: LoginController = new LoginController(
  authService,
  userService
);

// Payment controller
const paymentController: PaymentController = new PaymentController(
  userService,
  paymentService
);

/*
API routes
*/

// Auth route
app.use(generateApiRoute("auth"), authController.createRoutes());
// Users route
app.use(generateApiRoute("users"), userController.createRoutes());
// Payments route
app.use(generateApiRoute("payments"), paymentController.createRoutes());
// Login route
app.use("/", loginController.createRoutes());

// Start server
app.listen(process.env.USERSERVICE_PORT || 3000, () => {
  console.log(
    "User service listening on port %d",
    process.env.USERSERVICE_PORT || 3000
  );
});

export default app;

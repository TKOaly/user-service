import * as dotenv from "dotenv";
dotenv.config();

import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as session from "express-session";
import * as helmet from "helmet";
import * as Knex from "knex";
import * as Path from "path";

import AuthController from "./controllers/AuthController";
import LoginController from "./controllers/LoginController";
import PaymentController from "./controllers/PaymentController";
import UserController from "./controllers/UserController";
import PaymentDao from "./dao/PaymentDao";
import ServiceDao from "./dao/ServiceDao";
import UserDao from "./dao/UserDao";
import AuthenticationService from "./services/AuthenticationService";
import PaymentService from "./services/PaymentService";
import UserService from "./services/UserService";
import ApiRoute from "./utils/ApiRoute";

// Express application instance
const app: express.Application = express();

// JSON parser
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true
  })
);
app.use(cookieParser());
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    cookie: { secure: "auto", maxAge: 60000 },
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  })
);

// Set static folder
app.use(express.static("./public"));

// Set view engine
app.set("view engine", "pug");

// Helmet
app.use(helmet());

// Knexfile
import knexfile = require("../knexfile");
import PrivacyPolicyController from "./controllers/PrivacyPolicyController";
import ConsentDao from "./dao/ConsentDao";
import PrivacyPolicyDao from "./dao/PrivacyPolicyDao";
import ConsentService from "./services/ConsentService";
import PrivacyPolicyService from "./services/PrivacyPolicyService";

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

// Consent service
const consentService: ConsentService = new ConsentService(new ConsentDao(knex));

// Privacy policy service
const privacyPolicyService: PrivacyPolicyService = new PrivacyPolicyService(
  new PrivacyPolicyDao(knex)
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
  authService,
  paymentService
);

// Login controller
const loginController: LoginController = new LoginController(
  authService,
  userService,
  consentService,
  privacyPolicyService
);

// Payment controller
const paymentController: PaymentController = new PaymentController(
  userService,
  paymentService
);

// Privacy policy controller
const privacyPolicyController: PrivacyPolicyController = new PrivacyPolicyController(
  new PrivacyPolicyDao(knex)
);

/*
API routes
*/

// Auth route
app.use(ApiRoute.generateApiRoute("auth"), authController.createRoutes());
// Users route
app.use(ApiRoute.generateApiRoute("users"), userController.createRoutes());
// Payments route
app.use(
  ApiRoute.generateApiRoute("payments"),
  paymentController.createRoutes()
);
// Login route
app.use("/", loginController.createRoutes());
// Privacy policy route
app.use(
  ApiRoute.generateApiRoute("policy"),
  privacyPolicyController.createRoutes()
);

// Start server
app.listen(process.env.USERSERVICE_PORT || 3000, () => {
  // @ts-ignore
  console.log(
    "User service listening on port %d",
    process.env.USERSERVICE_PORT || 3000
  );
});

// Privacy policy directory
export const privacyPolicyDir: string = Path.resolve(
  Path.join(__dirname, "../", "privacy_policy/")
);

export default app;

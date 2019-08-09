import dotenv from "dotenv";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

import Raven from "raven";

import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import SessionFileStore from "session-file-store";
import helmet from "helmet";
import Knex from "knex";
import sassMiddleware from "node-sass-middleware";
import Path from "path";

import AuthController from "./controllers/AuthController";
import LoginController from "./controllers/LoginController";
import PaymentController from "./controllers/PaymentController";
import UserController from "./controllers/UserController";
import ApiRoute from "./utils/ApiRoute";

import * as knexfile from "../knexfile";
import PrivacyPolicyController from "./controllers/PrivacyPolicyController";

import i18n from "./i18n.config";
import LocalizationMiddleware from "./utils/LocalizationMiddleware";

// Config raven (only in production)
if (process.env.NODE_ENV === "production") {
  Raven.config(process.env.RAVEN_DSN).install();
} else {
  console.log("Skipping raven");
  Raven.config("").install();
}

// Knex instance
// @ts-ignore
const knex: Knex = Knex(knexfile[process.env.NODE_ENV! as Environment]);

// Express application instance
const app = express();

// Helmet
app.use(helmet());

// Disable cross-domain checks for now
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// Cookie parser
app.use(cookieParser());

// Localization middleware ensures the correct language
app.use(LocalizationMiddleware);

// Localization
app.use(i18n.init);

// Raven
app.use(Raven.requestHandler());

// JSON parser
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Trust proxy
app.set("trust proxy", 1);

const fileStoreOptions: SessionFileStore.Options = { path: Path.resolve(__dirname, "..", ".sessions") };
const FileStore = SessionFileStore(session);

// Session
app.use(
  session({
    cookie: { secure: "auto", maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || "unsafe",
    store: new FileStore(fileStoreOptions),
  }),
);

// Set view engine
app.set("view engine", "pug");

// SASS middleware
app.use(
  sassMiddleware({
    src: Path.join(__dirname, "..", "scss"),
    dest: Path.join(__dirname, "..", "public", "styles"),
    debug: false,
    outputStyle: "compressed",
    response: true,
  }),
);

// Set static folder
app.use(express.static(Path.join(__dirname, "..", "public")));

/*
API routes
*/

// Auth route
app.use(ApiRoute.generateApiRoute("auth"), AuthController.createRoutes());
// Users route
app.use(ApiRoute.generateApiRoute("users"), UserController.createRoutes());
// Payments route
app.use(ApiRoute.generateApiRoute("payments"), PaymentController.createRoutes());
// Login route
app.use("/", LoginController.createRoutes());
// Privacy policy route
app.use(ApiRoute.generateApiRoute("policy"), PrivacyPolicyController.createRoutes());

// CSRF
app.use((err: { code?: string }, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.code !== "EBADCSRFTOKEN") {
    return next(err);
  }
  return res.status(403).render("serviceError", {
    error: "Invalid CSRF token",
  });
});

export default app;

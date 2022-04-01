import dotenv from "dotenv";

import Raven from "raven";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import sassMiddleware from "node-sass-middleware";
import { join } from "path";

import AuthController from "./controllers/AuthController";
import LoginController from "./controllers/LoginController";
import PaymentController from "./controllers/PaymentController";
import UserController from "./controllers/UserController";
import PrivacyPolicyController from "./controllers/PrivacyPolicyController";

import LocalizationMiddleware from "./utils/LocalizationMiddleware";

import i18n from "./i18n.config";

import morgan from "morgan";
import { Environment } from "./Db";
import * as knexfile from "../knexfile";
import { generateApiRoute } from "./utils/ApiRoute";
const MySQLSessionStore = require("express-mysql-session")(session);
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

if (process.env.NODE_ENV === "production") {
  Raven.config(process.env.RAVEN_DSN).install();
} else {
  console.log("Skipping raven as the environment is not production");
  Raven.config("").install();
}

// Express application instance
const app = express();

// Helmet
app.use(helmet());

app.use(morgan("tiny"));

// Trust proxy
app.set("trust proxy", 1);

// Cookie parser
app.use(cookieParser());

// Localization
app.use(LocalizationMiddleware);
app.use(i18n.init);

// Raven
app.use(Raven.requestHandler());

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// Session
app.use(
  session({
    cookie: { secure: "auto", maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || "unsafe",
    store: new MySQLSessionStore({
      ...(knexfile[process.env.NODE_ENV! as Environment].connection as Record<string, unknown>),
    }),
  }),
);

app.use((req: any, _res: any, next: any) => {
  Raven.setContext({
    session: req.session,
  });

  next();
});

app.set("view engine", "pug");

// SASS middleware
app.use(
  sassMiddleware({
    src: join(process.cwd(), "scss"),
    dest: join(process.cwd(), "public", "styles"),
    debug: false,
    outputStyle: "compressed",
    response: true,
  }),
);

app.use(express.static(join(process.cwd(), "public")));

/*
API routes
*/

app.use(generateApiRoute("auth"), AuthController.createRoutes());
app.use(generateApiRoute("users"), UserController.createRoutes());
app.use(generateApiRoute("payments"), PaymentController.createRoutes());
app.use(generateApiRoute("policy"), PrivacyPolicyController.createRoutes());
app.use("/", LoginController.createRoutes());

// Ping route
app.get("/ping", (req, res) => res.json({ ok: true }));

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

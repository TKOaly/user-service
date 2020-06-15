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
import sassMiddleware from "node-sass-middleware";
import Path from "path";

import AuthController from "./controllers/AuthController";
import LoginController from "./controllers/LoginController";
import PaymentController from "./controllers/PaymentController";
import UserController from "./controllers/UserController";
import PrivacyPolicyController from "./controllers/PrivacyPolicyController";

import ApiRoute from "./utils/ApiRoute";
import LocalizationMiddleware from "./utils/LocalizationMiddleware";

import i18n from "./i18n.config";

import morgan from 'morgan'

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

app.use(morgan('tiny'));

// Disable cross-domain checks for now
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

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

const FileStore = SessionFileStore(session);

// Session
app.use(
  session({
    cookie: { secure: "auto", maxAge: 60000 },
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || "unsafe",
    store: new FileStore({ path: Path.resolve(__dirname, "..", ".sessions") }),
  }),
);

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

app.use(express.static(Path.join(__dirname, "..", "public")));

/*
API routes
*/

app.use(ApiRoute.generateApiRoute("auth"), AuthController.createRoutes());
app.use(ApiRoute.generateApiRoute("users"), UserController.createRoutes());
app.use(ApiRoute.generateApiRoute("payments"), PaymentController.createRoutes());
app.use(ApiRoute.generateApiRoute("policy"), PrivacyPolicyController.createRoutes());
app.use("/", LoginController.createRoutes());

// Ping route
app.get('/ping', (req, res) => res.json({ ok: true }));

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

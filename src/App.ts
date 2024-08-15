import dotenv from "dotenv";
import "express-async-errors";

import * as Sentry from "@sentry/node";
import cookieParser from "cookie-parser";
import express, { ErrorRequestHandler } from "express";
import session from "express-session";
import helmet from "helmet";
import { join } from "path";

import AuthController from "./controllers/AuthController";
import OAuthController from "./controllers/OAuthController";
import LoginController, { ISessionUser } from "./controllers/LoginController";
import PaymentController from "./controllers/PaymentController";
import UserController from "./controllers/UserController";
import PrivacyPolicyController from "./controllers/PrivacyPolicyController";
import PricingsController from "./controllers/PricingsController";

import initLocalization from "./i18n.config";

import morgan from "morgan";
import { generateApiRoute } from "./utils/ApiRoute";
import UserService from "./services/UserService";
import { ConnectSessionKnexStore } from "connect-session-knex";
import { knexInstance } from "./Db";
import Service from "./models/Service";
import User from "./models/User";
import ServiceToken from "./token/Token";
import { LoginStep } from "./utils/AuthorizeMiddleware";
import { generateToken } from "./csrf";
dotenv.config();

declare global {
  // express typings just work this way
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      service: Service;
      authorization?: {
        user: User;
        token: ServiceToken;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: ISessionUser;
    loginStep?: LoginStep;
    keys: Array<{ name: string; value: unknown }>;
  }
}

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

if (process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: "production",
  });
} else {
  console.log("Skipping sentry init as the environment is not production");
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
initLocalization(app);

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
    store: new ConnectSessionKnexStore({
      knex: knexInstance,
      tableName: "knex_sessions",
      createTable: true,
    }),
  }),
);

app.locals.currentYear = () => new Date().getFullYear();

app.use((req, _res, next) => {
  Sentry.setContext("session", req.session ?? {});
  next();
});

app.use((req, res, next) => {
  const render = res.render.bind(res);

  res.render = (...[view, ...args]: Parameters<typeof render>) => {
    res.locals.title = req.t(`${view}_title`);
    render(view, ...args);
  };

  next();
});

app.set("view engine", "pug");

app.use((req, res, next) => {
  res.locals.csrfToken = generateToken(req);
  next();
});

app.use(express.static(join(process.cwd(), "public")));

/*
API routes
*/

app.use(generateApiRoute("auth"), AuthController.createRoutes());
app.use(generateApiRoute("pricings"), PricingsController.createRoutes());
app.use(generateApiRoute("users"), UserController.createRoutes());
app.use(generateApiRoute("payments"), PaymentController.createRoutes());
app.use(generateApiRoute("policy"), PrivacyPolicyController.createRoutes());
app.use("/.well-known/openid-configuration", OAuthController.createDiscoveryRoute());
app.use("/oauth", OAuthController.createRoutes());
app.use("/", LoginController.createRoutes());

// Ping route
app.get("/ping", (_req, res) => res.json({ ok: true }));

// Sentry
Sentry.setupExpressErrorHandler(app);

// CSRF
app.use(((err, _req, res, next) => {
  if (err.code !== "EBADCSRFTOKEN") {
    return next(err);
  }

  return res.status(403).render("serviceError", {
    error: "Invalid CSRF token",
  });
}) satisfies ErrorRequestHandler);

UserService.start();

export default app;

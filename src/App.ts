import Raven from "raven";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import sassMiddleware from "node-sass-middleware";
import { join } from "path";

import LocalizationMiddleware from "./middleware/LocalizationMiddleware";

import { initI18n } from "./i18n";

import morgan from "morgan";
import { Environment, knexInstance } from "./Db";
import * as knexfile from "../knexfile";
import { apiRoute } from "./middleware/ApiRouteMiddleware";
import { Env } from "./env";
import { AuthController } from "./controllers/AuthController";
import { UserController } from "./controllers/UserController";
import { LoginController } from "./controllers/LoginController";
import { PaymentController } from "./controllers/PaymentController";
import { PrivacyPolicyController } from "./controllers/PrivacyPolicyController";

const MySQLSessionStore = require("express-mysql-session")(session);

export const createApp = (env: Env) => {
  if (env.NODE_ENV === "production") {
    Raven.config(env.RAVEN_DSN).install();
  } else {
    console.log("Skipping raven as the environment is not production");
    Raven.config().install();
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
  app.use(LocalizationMiddleware(env));
  app.use(initI18n(env));

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
      secret: env.SESSION_SECRET,
      store: new MySQLSessionStore({
        ...(knexfile[env.NODE_ENV as Environment].connection as Record<string, unknown>),
      }),
    }),
  );

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

  app.use(apiRoute("auth"), new AuthController(env).createRoutes());
  app.use(apiRoute("users"), new UserController(env).createRoutes());
  app.use(apiRoute("payments"), new PaymentController(env).createRoutes());
  app.use(apiRoute("policy"), new PrivacyPolicyController().createRoutes());
  app.use("/", new LoginController(env).createRoutes());

  // Ping route
  app.get("/ping", async (_req, res) => {
    try {
      await knexInstance.raw("SELECT 1");
      res.json({ ok: true });
    } catch (err) {
      res.sendStatus(500);
    }
  });

  // CSRF
  app.use((err: { code?: string }, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err.code !== "EBADCSRFTOKEN") {
      return next(err);
    }
    return res.status(403).render("serviceError", {
      error: "Invalid CSRF token",
    });
  });

  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    if (env.NODE_ENV === "production") {
      return res.sendStatus(500);
    }
    return next(err);
  });

  return app;
};

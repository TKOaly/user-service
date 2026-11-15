import dotenv from "dotenv";

import app from "./App";
import UserService from "./services/UserService";
import { logger } from "./logger";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set.");
}

// Record crashes in the structured log before Node (or Sentry) handles them.
process.on("uncaughtExceptionMonitor", (err, origin) => {
  logger.fatal({ err, origin }, "Process crashed");
});

UserService.start();

// Service port
const port = Number(process.env.USERSERVICE_PORT || 3000);

// Start server
app.listen(port, () => {
  logger.info({ port }, "User service listening on port %d", port);
});

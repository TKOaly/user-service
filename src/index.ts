import dotenv from "dotenv";

import app from "./App";
import UserService from "./services/UserService";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set.");
}

UserService.start();

// Service port
const port = Number(process.env.USERSERVICE_PORT || 3000);

// Start server
app.listen(port, () => {
  console.log("User service listening on port %d with environment: %s", port, process.env.NODE_ENV);
});

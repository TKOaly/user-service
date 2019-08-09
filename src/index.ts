import dotenv from "dotenv";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

import app from "./App";

// Service port
const port: number = Number(process.env.USERSERVICE_PORT || 3000);

// Start server
app.listen(port, () => {
  // @ts-ignore
  console.log("User service listening on port %d with environment: %s", port, process.env.NODE_ENV);
});

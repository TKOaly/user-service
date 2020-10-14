import dotenv from "dotenv";

import app from "./App";
dotenv.config();

if (!process.env.NODE_ENV) {
  throw new Error("NODE_ENV environment variable must be set.");
}

// Service port
const port = Number(process.env.USERSERVICE_PORT || 3000);

// Start server
app.listen(port, () => {
  // @ts-ignore
  console.log("User service listening on port %d with environment: %s", port, process.env.NODE_ENV);
});

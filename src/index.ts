import * as dotenv from "dotenv";
dotenv.config();

import app from "./App";

// Service port
const port: number = Number(process.env.USERSERVICE_PORT || 3000);

// Start server
app.listen(port, () => {
  // @ts-ignore
  console.log("User service listening on port %d", port);
});

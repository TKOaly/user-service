import { createApp } from "./App";
import { getEnvironment } from "./env";

const env = getEnvironment();
const app = createApp(env);

// Start server
app.listen(env.USERSERVICE_PORT, () => {
  console.log("User service listening on port %d with environment: %s", env.USERSERVICE_PORT, env.NODE_ENV);
});

import { Formatter, parseEnvironmentVariables } from "@absxn/process-env-parser";
import dotenv from "dotenv";
import { Environment } from "./Db";

const envs: Array<Environment> = ["development", "test", "production", "staging"];

const isNodeEnv = (x: unknown): x is Environment => {
  return envs.indexOf(x as Environment) > -1;
};
const parseNodeEnv = (env: string): Environment => {
  if (!isNodeEnv(env)) {
    throw new Error(
      `NODE_ENV is set to an invalid value. It should be either development, test, production or staging. Got: ${env}`,
    );
  }
  return env;
};

export const getEnvironment = () => {
  dotenv.config();
  const result = parseEnvironmentVariables({
    NODE_ENV: { parser: parseNodeEnv },
    USERSERVICE_PORT: { parser: parseInt, default: 3000 },
    DB_HOST: {},
    DB_PORT: { parser: parseInt, default: 3306 },
    DB_USER: {},
    DB_PASSWORD: { mask: true },
    DB_NAME: {},
    SESSION_SECRET: { mask: true, default: "unsafe" },
    JWT_SECRET: { mask: true },
    COOKIE_DOMAIN: { default: "localhost" },
    DEFAULT_LOCALE: { default: "fi" },
    RAVEN_DSN: { default: "" },
  });

  if (result.success) {
    console.table(result.envPrintable);
    return result.env;
  } else {
    console.log(Formatter.multiLine(result));
    throw new Error("Could not parse environment variables");
  }
};

export type Env = ReturnType<typeof getEnvironment>;

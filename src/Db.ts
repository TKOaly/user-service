import Knex from "knex";
import * as knexfile from "../knexfile";
import { getEnvironment } from "./env";
export type Environment = "development" | "staging" | "test" | "production";

const env = getEnvironment();
export const knexInstance = Knex(knexfile[env.NODE_ENV]);

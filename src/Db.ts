import Knex from "knex";
import * as knexfile from "../knexfile";
export type Environment = "development" | "staging" | "test" | "production";

export const knexInstance = Knex(knexfile[process.env.NODE_ENV! as Environment]);

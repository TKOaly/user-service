import { Knex } from "knex";
import users from "./seedData/users";

exports.seed = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }

  if (process.env.SEED_FOR_TKOALY_LOCALHOST === "true") {
    // don't seed user related data in tko-aly.localhost
    return;
  }

  // Deletes ALL existing entries
  await knex("privacy_policy_consent_data").del();
  await knex("users").del();
  return await knex("users").insert(users);
};

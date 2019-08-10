import users from "./seedData/users";
import Knex from "knex";

exports.seed = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }
  // Deletes ALL existing entries
  await knex("privacy_policy_consent_data").del();
  await knex("users").del();
  return await knex("users").insert(users);
};

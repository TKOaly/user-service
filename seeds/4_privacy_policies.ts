import Knex from "knex";
import privacyPolicies from "./seedData/privacy_policies";

exports.seed = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }
  // Deletes ALL existing entries
  await knex("privacy_policies").del();
  return await knex("privacy_policies").insert(privacyPolicies);
};

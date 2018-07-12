import * as Knex from "knex";
import privacyPolicies from "./seedData/privacy_policies";

exports.seed = async function(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("privacy_policies").del();
  return await knex("privacy_policies").insert(privacyPolicies);
};

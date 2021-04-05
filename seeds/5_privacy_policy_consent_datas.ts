import Knex from "knex";
import consentData from "./seedData/privacy_policy_consent_datas";
exports.seed = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }
  // Deletes ALL existing entries
  await knex("privacy_policy_consent_data").del();
  return await knex("privacy_policy_consent_data").insert(consentData);
};

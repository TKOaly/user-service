import { Knex } from "knex";
import privacyPolicies from "./seedData/privacy_policies";
import consentData from "./seedData/privacy_policy_consent_datas";
import services from "./seedData/services";

exports.seed = async function (knex: Knex) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }

  if (process.env.SEED_FOR_TKOALY_LOCALHOST === "true") {
    // make an effort at seeding the services and privacy policies but just let it fail if they're already seeded
    // or local dev work has produced conflicting IDs
    //
    // a fancier solution would probably match by uuid and skip those, and not have a hardcoded id in that case
    for (const service of services) {
      try {
        await knex("services").insert([service]);
      } catch (_e) {
        console.error(`Error while seeding service, skipping it...`, service);
      }
    }
    for (const policy of privacyPolicies) {
      try {
        await knex("privacy_policies").insert([policy]);
      } catch (_e) {
        console.error(`Error while seeding privacy policy, skipping it...`, policy);
      }
    }
    return;
  }

  // only user-service dev - seed with ids

  // Deletes ALL existing entries
  await knex("privacy_policies").del();
  await knex("privacy_policy_consent_data").del();
  await knex("services").del();

  await knex("services").insert(services);
  await knex("privacy_policies").insert(privacyPolicies);
  await knex("privacy_policy_consent_data").insert(consentData);
};

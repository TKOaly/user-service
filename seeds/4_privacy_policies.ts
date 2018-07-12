import * as Knex from "knex";
import IPrivacyPolicy from "../src/interfaces/IPrivacyPolicy";

exports.seed = async function(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex("privacy_policy").del();
  // Inserts seed entries
  const privacyPolicy: IPrivacyPolicy = {
    id: 1,
    name: "test",
    text: "Hello World",
    created: new Date(),
    modified: new Date()
  };
  return await knex("privacy_policy").insert(privacyPolicy);
};

import { Knex } from "knex";
const payments = require("./seedData/payments");

exports.seed = async function (knex: Knex) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }

  if (process.env.SEED_FOR_TKOALY_LOCALHOST === "true") {
    // don't seed user related data in tko-aly.localhost
    return;
  }

  // Deletes ALL existing entries
  await knex("payments").del();
  // Inserts seed entries
  await knex("payments").insert(payments);
};

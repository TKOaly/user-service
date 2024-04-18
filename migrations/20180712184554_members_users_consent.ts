import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("privacy_policy_consent_data");
  if (!hasTable) {
    await knex.schema.createTable("privacy_policy_consent_data", function(table){
      table.increments("id").primary();
      table.integer("user_id").unsigned().notNullable().index().references("id").inTable("users");
      table.integer("service_id").unsigned().notNullable().index().references("id").inTable("services");
      table.enum("consent", ["unknown", "accepted", "declined"]).defaultTo("unknown");
      table.dateTime("created");
      table.dateTime("modified");
    });
  }
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  const hasTable = await knex.schema.hasTable("privacy_policy_consent_data");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policy_consent_data");
  }
};

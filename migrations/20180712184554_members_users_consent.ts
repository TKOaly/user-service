import * as Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasTable: boolean = await knex.schema.hasTable("privacy_policy_consent_data");
  if (!hasTable) {
    await knex.schema.createTable("privacy_policy_consent_data", (t: Knex.CreateTableBuilder) => {
      t.increments("id").primary();
      t.specificType("user_id", "int(10) unsigned DEFAULT NULL");
      t.specificType("service_id", "int(10) unsigned DEFAULT NULL");
      t.enum("consent", ["unknown", "accepted", "declined"]).defaultTo("unknown");
      t.dateTime("created");
      t.dateTime("modified");

      t.foreign("user_id").references("id").inTable("users");
      t.foreign("service_id").references("id").inTable("services");
    });
  }
};

exports.down = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  const hasTable: boolean = await knex.schema.hasTable("privacy_policy_consent_data");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policy_consent_data");
  }
};

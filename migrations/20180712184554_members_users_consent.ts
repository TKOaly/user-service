import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasTable: boolean = await knex.schema.hasTable("privacy_policy_consent_data");
  if (!hasTable) {
    await knex.schema.createTable("privacy_policy_consent_data", (t: Knex.CreateTableBuilder) => {
      t.increments("id").primary();
      t.integer("user_id")
        .unsigned()
        .notNullable()
        .index()
        .references("id")
        .inTable("users");
      t.integer("service_id")
        .unsigned()
        .notNullable()
        .index()
        .references("id")
        .inTable("services");
      t.enum("consent", ["unknown", "accepted", "declined"]).defaultTo("unknown");
      t.dateTime("created");
      t.dateTime("modified");
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

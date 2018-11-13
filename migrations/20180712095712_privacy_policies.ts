import * as Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasTable: boolean = await knex.schema.hasTable("privacy_policies");
  if (!hasTable) {
    await knex.schema.createTable(
      "privacy_policies",
      (t: Knex.CreateTableBuilder) => {
        t.increments("id").primary();
        t.specificType("service_id", "int(10) unsigned DEFAULT NULL");
        t.string("text", 15000).notNullable();
        t.dateTime("created");
        t.dateTime("modified");
        t.foreign("service_id").references("id").inTable("services");
      }
    );
  }
};

exports.down = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  const hasTable: boolean = await knex.schema.hasTable("privacy_policies");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policies");
  }
};

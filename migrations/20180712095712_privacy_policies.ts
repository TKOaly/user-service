import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("privacy_policies");
  if (!hasTable) {
    await knex.schema.createTable("privacy_policies", function(table) {
      table.increments("id").primary();
      table.integer("service_id").unsigned().unique().notNullable().index().references("id").inTable("services");
      table.string("text", 15000).notNullable();
      table.dateTime("created");
      table.dateTime("modified");
    });
  }
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  const hasTable = await knex.schema.hasTable("privacy_policies");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policies");
  }
};

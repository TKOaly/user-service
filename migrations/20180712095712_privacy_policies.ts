import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable("privacy_policies");
  if (!hasTable) {
    await knex.schema.createTable("privacy_policies", (t: Knex.CreateTableBuilder)=> {
      t.increments("id").primary();
      t.integer("service_id").unsigned().unique().notNullable().index().references("id").inTable("services");
      t.string("text", 15000).notNullable();
      t.dateTime("created");
      t.dateTime("modified");
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

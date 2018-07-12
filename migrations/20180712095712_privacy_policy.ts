import * as Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasTable: boolean = await knex.schema.hasTable("privacy_policy");
  if (!hasTable) {
    await knex.schema.createTable(
      "privacy_policy",
      (t: Knex.CreateTableBuilder) => {
        t.increments("id");
        t.string("name", 255).notNullable();
        t.string("text", 65535).notNullable();
        t.dateTime("created");
        t.dateTime("modified");
      }
    );
  }
};

exports.down = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  const hasTable: boolean = await knex.schema.hasTable("privacy_policy");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policy");
  }
};

import * as Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasTable: boolean = await knex.schema.hasTable("privacy_policies");
  if (!hasTable) {
    await knex.schema.createTable(
      "privacy_policies",
      (t: Knex.CreateTableBuilder) => {
        t.increments("id");
        t.integer("service_id")
          .unsigned()
          .unique()
          .index()
          .references("id")
          .inTable("services");
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
  const hasTable: boolean = await knex.schema.hasTable("privacy_policies");
  if (hasTable) {
    await knex.schema.dropTable("privacy_policies");
  }
};

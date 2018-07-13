import * as Promise from "bluebird";
import * as Knex from "knex";

exports.up = function(knex: Knex): Promise<void> {
  return knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
    t.dateTime("created").defaultTo(knex.fn.now());
    t.dateTime("modified").defaultTo(knex.fn.now());
  });
};

exports.down = function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
    t.dropColumn("created");
    t.dropColumn("modified");
  });
};

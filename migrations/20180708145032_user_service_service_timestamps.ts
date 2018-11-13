import Knex from "knex";

exports.up = function (knex: Knex): PromiseLike<void> {
  return knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
    t.dateTime("created");
    t.dateTime("modified");
  });
};

exports.down = function (knex: Knex): PromiseLike<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
    t.dropColumn("created");
    t.dropColumn("modified");
  });
};

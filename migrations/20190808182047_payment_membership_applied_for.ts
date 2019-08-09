import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  return knex.schema.table("payments", t => {
    t.string("membership_applied_for");
  });
};

exports.down = async function(knex: Knex): Promise<void> {
  return knex.schema.table("payments", t => {
    t.dropColumn("membership_applied_for");
  });
};

import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  return knex.schema.table("services", t => {
    t.string("membership_applied_for");
  });
};

exports.down = async function(knex: Knex): Promise<void> {
  return knex.schema.table("services", t => {
    t.dropColumn("membership_applied_for");
  });
};

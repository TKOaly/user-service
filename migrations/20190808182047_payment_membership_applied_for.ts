import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const has = await knex.schema.hasColumn("payments", "membership_applied_for");
  if (!has) {
    await knex.schema.table("payments", t => {
      t.string("membership_applied_for");
    });
  }
};

exports.down = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }

  const has = await knex.schema.hasColumn("payments", "membership_applied_for");
  if (has) {
    await knex.schema.table("payments", t => {
      t.dropColumn("membership_applied_for");
    });
  }
};

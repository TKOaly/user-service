import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("users", "password_hash")) {
    return;
  }

  await knex.schema.table("users", t => {
    t.text("password_hash");
  });
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }

  if (!(await knex.schema.hasColumn("users", "password_hash"))) {
    return;
  }

  await knex.schema.table("users", t => {
    t.dropColumn("password_hash");
  });
};

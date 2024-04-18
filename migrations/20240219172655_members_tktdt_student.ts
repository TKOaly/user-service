import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("users", "tktdt_student")) {
    return;
  }

  await knex.schema.table("users", t => {
    t.specificType("tktdt_student", "tinyint(1)").defaultTo(null);
  });
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }

  if (!(await knex.schema.hasColumn("users", "tktkt_student"))) {
    return;
  }

  await knex.schema.table("users", t => {
    t.dropColumn("tktdt_student");
  });
};

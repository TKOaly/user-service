import Knex from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn("calendar_events", "alcohol_meter")) {
    return;
  }

  await knex.schema.table("calendar_events", t => {
    t.specificType("alcohol_meter", "tinyint(1)").defaultTo(null);
  });
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }

  if (!(await knex.schema.hasColumn("calendar_events", "alcohol_meter"))) {
    return;
  }

  await knex.schema.table("calendar_events", t => {
    t.dropColumn("alcohol_meter");
  });
};

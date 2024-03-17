import Knex from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable("calendar_events"))) {
    return;
  }

  if (!(await knex.schema.hasColumn("calendar_events", "alcohol_meter"))) {
    return;
  }

  await knex.schema.raw("ALTER TABLE calendar_events MODIFY COLUMN alcohol_meter tinyint(2)");
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not revert database columns in production");
  }

  if (!(await knex.schema.hasTable("calendar_events"))) {
    return;
  }

  if (!(await knex.schema.hasColumn("calendar_events", "alcohol_meter"))) {
    return;
  }

  await knex.schema.raw("ALTER TABLE calendar_events MODIFY COLUMN alcohol_meter tinyint(1)");
};

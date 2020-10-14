import Knex from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const hasCreated = await knex.schema.hasColumn("services", "created");
  const hasModified = await knex.schema.hasColumn("services", "modified");
  if (!hasCreated && !hasModified) {
    await knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
      t.dateTime("created");
      t.dateTime("modified");
    });
  }
};

exports.down = async function (knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }

  const hasCreated = await knex.schema.hasColumn("services", "created");
  const hasModified = await knex.schema.hasColumn("services", "modified");
  if (hasCreated && hasModified) {
    await knex.schema.table("services", (t: Knex.AlterTableBuilder) => {
      t.dropColumn("created");
      t.dropColumn("modified");
    });
  }
};

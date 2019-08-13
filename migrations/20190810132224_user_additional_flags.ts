import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  const hasHyStaff = await knex.schema.hasColumn("users", "hy_staff");
  const hasHyStudent = await knex.schema.hasColumn("users", "hy_student");
  if (!hasHyStaff && !hasHyStudent) {
    await knex.schema.table("users", t => {
      t.specificType("hy_staff", "tinyint(1) DEFAULT NULL");
      t.specificType("hy_student", "tinyint(1) DEFAULT NULL");
    });
  }
};

exports.down = async function(knex: Knex): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database columns in production");
  }
  const hasHyStaff = await knex.schema.hasColumn("users", "hy_staff");
  const hasHyStudent = await knex.schema.hasColumn("users", "hy_student");
  if (hasHyStaff && hasHyStudent) {
    await knex.schema.table("users", t => {
      t.dropColumn("hy_staff");
      t.dropColumn("hy_student");
    });
  }
};

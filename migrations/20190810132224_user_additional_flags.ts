import Knex from "knex";

exports.up = async function(knex: Knex): Promise<void> {
  return knex.schema.table("users", t => {
    t.specificType("hy_staff", "tinyint(1) DEFAULT NULL");
    t.specificType("hy_student", "tinyint(1) DEFAULT NULL");
  });
};

exports.down = async function(knex: Knex): Promise<void> {
  return knex.schema.table("users", t => {
    t.dropColumn("hy_staff");
    t.dropColumn("hy_student");
  });
};

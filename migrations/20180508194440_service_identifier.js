exports.up = function(knex, Promise) {
  return knex.schema.table("services", t => {
    t.string("service_identifier");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table("services", t => {
    t.dropColumn("service_identifier");
  });
};

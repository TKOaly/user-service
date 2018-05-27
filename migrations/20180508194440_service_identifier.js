exports.up = function(knex, Promise) {
  return knex.schema.table("services", t => {
    t.string("service_identifier");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table("services", t => {
    return knex.schema.hasColumn("services", "service_identifier").then(exists => {
      if (exists) {
        t.dropColumn("service_identifier");
      }
    });
  });
};

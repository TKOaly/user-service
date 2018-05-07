
exports.up = function (knex, Promise) {
  return knex.schema.hasTable("services").then(exists => {
    if (!exists) {
      return knex.schema.createTable("services", table => {
        table.increments("id");
        table.string("service_name");
        table.integer("data_permissions", 32);
      });
    }
  });
};

exports.down = function (knex, Promise) {
  return knex.schema.dropTableIfExists("services");
};

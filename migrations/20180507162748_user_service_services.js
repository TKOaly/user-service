exports.up = function(knex, Promise) {
  return knex.schema.hasTable("services").then(function(exists) {
    if (!exists) {
      return knex.schema.createTable("services", table => {
        table.increments("id");
        table.string("service_name");
        table.integer("data_permissions", 32);
      });
    }
  });
};

exports.down = function(knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.hasTable("services").then(function(exists) {
    if (exists) {
      return knex.schema.dropTable("services");
    }
  });
};

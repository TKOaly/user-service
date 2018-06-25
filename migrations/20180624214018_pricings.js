exports.up = function(knex, Promise) {
  return knex.schema.hasTable("pricings").then(function(exists) {
    if (!exists) {
      return knex.schema.createTable("pricings", function(table) {
        table.increments("id");

        table.string("membership", 20).defaultTo(null);
        table
          .integer("seasons", 10)
          .unsigned()
          .defaultTo(null);
        table.specificType("price", "decimal(6,2) DEFAULT NULL");
        table.datetime("starts").defaultTo(null);

        table.unique("id");
      });
    }
  });
};

exports.down = function(knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.hasTable("pricings").then(function(exists) {
    if (exists) {
      return knex.schema.dropTable("pricings");
    }
  });
};

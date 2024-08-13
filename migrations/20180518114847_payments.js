exports.up = function (knex, Promise) {
  return knex.schema.hasTable("payments").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("payments", function (table) {
        table.increments("id");
        table.integer("payer_id", 10).unsigned().defaultTo(null);
        table.integer("confirmer_id", 10).unsigned().defaultTo(null);
        table.datetime("created").defaultTo(null);
        table.string("reference_number", 20).defaultTo(null);
        table.specificType("amount", "decimal(6,2) DEFAULT NULL");
        table.datetime("valid_until").defaultTo(null);
        table.datetime("paid").defaultTo(null);
        table.string("payment_type", 20).defaultTo(null);

        table.unique("id");
      });
    }
  });
};

exports.down = function (knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.hasTable("payments").then(function (exists) {
    if (exists) {
      return knex.schema.dropTable("payments");
    }
  });
};

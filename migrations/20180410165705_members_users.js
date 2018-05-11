exports.up = function(knex, Promise) {
  return knex.schema.hasTable("users").then(function(exists) {
    if (!exists) {
      return knex.schema.createTable("users", function(table) {
        table.increments("id");
        table.string("username", 20);
        table.string("name", 255);
        table.string("screen_name", 255);
        table.string("email", 255);
        table.string("residence", 255);
        table.string("phone", 255);
        table.integer("hyy_member", 1);
        table.string("membership", 20);
        table.datetime("created");
        table.datetime("modified");
        table.string("hashed_password", 40);
        table.string("salt", 20);
        table.string("role", 40);
        table.integer("tktl", 1);
        table.integer("deleted", 1);
      });
    }
  });
};

exports.down = function(knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }
  return knex.schema.hasTable("users").then(function(exists) {
    if (exists) {
      return knex.schema.dropTable("users");
    }
  });
};

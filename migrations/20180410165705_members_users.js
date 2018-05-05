exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists("users", function(table) {
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
    table.char("hashed_password", 40);
    table.string("salt", 20);
    table.integer("tktl", 1);
    table.integer("deleted", 1);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists("users");
};

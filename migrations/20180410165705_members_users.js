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
        table.specificType('hyy_member', 'tinyint(1) DEFAULT NULL');
        table.string("membership", 20);
        table.datetime("created");
        table.datetime("modified");
        table.specificType('hashed_password', 'char(40) DEFAULT NULL');
        table.string("salt", 20);
        table.string("role", 40);
        table.specificType('tktl', 'tinyint(1) DEFAULT NULL');
        table.specificType('deleted', 'tinyint(1) DEFAULT NULL');
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

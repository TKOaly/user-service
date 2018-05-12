
exports.up = function(knex, Promise) {
  return knex.schema.table("users", t => {
    t.string("hashed_password").notNullable();
    t.string("salt").nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table("users", t => {
    t.dropColumn("hashed_password");
    t.dropColumn("salt");
  });
};

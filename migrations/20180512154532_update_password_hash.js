exports.up = function(knex, Promise) {
  return knex.schema.alterTable("users", t => {
    t
      .string("hashed_password")
      .notNullable()
      .alter();
    t.string("salt", 20).alter();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable("users", t => {
    t.specificType("hashed_password", "char(40) DEFAULT NULL").alter();
    t
      .string("salt", 20)
      .nullable()
      .alter();
  });
};

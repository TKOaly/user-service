exports.up = function(knex, Promise) {
  return knex.schema.table("services", t => {
    t.string("display_name");
    t.string("redirect_url");
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table("services", t => {
    t.dropColumn("display_name");
    t.dropColumn("redirect_url");
  });
};

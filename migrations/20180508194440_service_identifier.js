exports.up = function (knex, Promise) {
  return knex.schema.hasColumn("services", "service_identifier").then(has => {
    if (!has) {
      return knex.schema.table("services", t => {
        t.string("service_identifier");
      });
    }
  });
};

exports.down = function (knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }

  return knex.schema.hasColumn("services", "service_identifier").then(exists => {
    if (exists) {
      return knex.schema.table("services", t => {
        t.dropColumn("service_identifier");
      });
    }
  });
};

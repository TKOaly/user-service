exports.up = function(knex, Promise) {
  return knex.schema.hasColumn("services", "display_name").then(hasDisplayName => {
    return knex.schema.hasColumn("services", "redirect_url").then(hasRedirectUrl => {
      if (!hasDisplayName && !hasRedirectUrl) {
        return knex.schema.table("services", t => {
          t.string("display_name");
          t.string("redirect_url");
        });
      }
    });
  });
};

exports.down = function(knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Do not drop database tables in production");
  }

  return knex.schema.hasColumn("services", "display_name").then(hasDisplayName => {
    return knex.schema.hasColumn("services", "redirect_url").then(hasRedirectUrl => {
      if (hasDisplayName && hasRedirectUrl) {
        return knex.schema.table("services", t => {
          t.dropColumn("display_name");
          t.dropColumn("redirect_url");
        });
      }
    });
  });
};

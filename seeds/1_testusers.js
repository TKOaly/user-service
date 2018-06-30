const sha1 = require("sha1");

const encryptPassword = (password, salt) => sha1(salt + "kekbUr" + password);

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("users")
    .del()
    .then(function() {
      // Inserts seed entries
      return knex("users").insert([
        {
          id: 1,
          username: "test_user",
          name: "Test User",
          screen_name: "tuser",
          email: "test@user.com",
          residence: "Test",
          phone: "1234567890",
          hyy_member: 1,
          membership: "ei-jasen",
          created: new Date(),
          modified: new Date(),
          hashed_password: encryptPassword("test_user", "12345"),
          salt: "12345",
          role: "jasen",
          tktl: 1,
          deleted: 0
        },
        {
          id: 2,
          username: "admin_user",
          name: "ADmin User",
          screen_name: "admin_user",
          email: "admin@user.com",
          residence: "Test",
          phone: "1234567890",
          hyy_member: 1,
          membership: "jasen",
          created: new Date(),
          modified: new Date(),
          hashed_password: encryptPassword("admin_user", "12345"),
          salt: "12345",
          role: "yllapitaja",
          tktl: 1,
          deleted: 0
        }
      ]);
    });
};

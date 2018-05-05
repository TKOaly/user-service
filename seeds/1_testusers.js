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
          membership: "member",
          created: new Date(),
          modified: new Date(),
          hashed_password: "hashedpassword",
          salt: "1234",
          tktl: 1,
          deleted: 0
        }
      ]);
    });
};

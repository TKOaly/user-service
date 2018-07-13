const users = require("./seedData/users");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("privacy_policy_consent_data")
    .del()
    .then(function() {
      return knex("users")
        .del()
        .then(function() {
          // Inserts seed entries
          return knex("users").insert(users);
        });
    });
};

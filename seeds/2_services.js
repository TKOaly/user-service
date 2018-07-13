const services = require("./seedData/services");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("privacy_policies")
    .del()
    .then(function() {
      return knex("privacy_policy_consent_data")
        .del()
        .then(function() {
          return knex("services")
            .del()
            .then(function() {
              // Inserts seed entries
              return knex("services").insert(services);
            });
        });
    });
};

const services = require("./seedData/services");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("services")
    .del()
    .then(function() {
      // Inserts seed entries
      return knex("services").insert(services);
    });
};

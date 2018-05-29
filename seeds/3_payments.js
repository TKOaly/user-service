const payments = require("./seedData/payments");

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("payments")
    .del()
    .then(function() {
      // Inserts seed entries
      return knex("payments").insert(payments);
    });
};

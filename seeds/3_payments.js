const payments = require("./seedData/payments");

exports.seed = function (knex, Promise) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Please do not seed a production database.");
  }
  // Deletes ALL existing entries
  return knex("payments")
    .del()
    .then(function () {
      // Inserts seed entries
      return knex("payments").insert(payments);
    });
};

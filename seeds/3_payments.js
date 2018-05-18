exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex("payments")
    .del()
    .then(function() {
      // Inserts seed entries
      return knex("payments").insert([
        {
          id: 1,
          payer_id: 1,
          confirmer_id: 1,
          created: new Date(2016, 1, 1),
          reference_number: "123456789",
          amount: 55.55,
          valid_until: new Date(2019, 1, 1),
          paid: new Date(2016, 1, 1),
          payment_type: "Jasenmaksu"
        }
      ]);
    });
};
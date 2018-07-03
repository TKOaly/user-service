module.exports = [
  {
    id: 1,
    payer_id: 1,
    confirmer_id: 1,
    created: new Date(2016, 1, 1),
    reference_number: "123456789",
    amount: 55.55,
    valid_until: new Date(2019, 1, 1),
    paid: new Date(2016, 1, 1),
    payment_type: "jasenmaksu",
  },
  {
    id: 2,
    payer_id: 2,
    confirmer_id: 1,
    created: new Date(2015, 1, 1),
    reference_number: "234567890",
    amount: 44.44,
    valid_until: new Date(2018, 1, 1),
    paid: new Date(2015, 1, 1),
    payment_type: "jasenmaksu",
  },
];

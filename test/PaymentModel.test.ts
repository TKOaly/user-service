process.env.NODE_ENV = "test";

import "mocha";
import Payment from "../src/models/Payment";
const chai: Chai.ChaiStatic = require("chai");
const should = chai.should();

let payment: Payment;

describe("Payment model", () => {
  beforeEach(done => {
    payment = new Payment({
      id: 1,
      amount: 50.55,
      confirmer_id: 2,
      created: new Date(2018, 1, 1),
      paid: new Date(2018, 1, 1),
      payer_id: 1,
      payment_type: "jasenmaksu",
      reference_number: "12345678",
      valid_until: new Date(2020, 1, 1)
    });
    done();
  });

  it("Sets data correctly", done => {
    payment.id.should.equal(1);
    payment.amount.should.equal(50.55);
    payment.confirmer_id.should.equal(2);
    payment.payer_id.should.equal(1);
    payment.payment_type.should.equal("jasenmaksu");
    payment.reference_number.should.equal("12345678");
    payment.created
      .toDateString()
      .should.equal(new Date(2018, 1, 1).toDateString());
    payment.valid_until
      .toDateString()
      .should.equal(new Date(2020, 1, 1).toDateString());
    payment.paid
      .toDateString()
      .should.equal(new Date(2018, 1, 1).toDateString());
    done();
  });

  it("Sets partial data correctly", done => {
    const payment2: Payment = new Payment({
      id: 55,
      amount: 200
    });
    payment2.id.should.equal(55);
    payment2.amount.should.equal(200);
    should.not.exist(payment2.confirmer_id);
    should.not.exist(payment2.created);
    should.not.exist(payment2.paid);
    should.not.exist(payment2.payer_id);
    should.not.exist(payment2.payment_type);
    should.not.exist(payment2.reference_number);
    should.not.exist(payment2.valid_until);
    done();
  });
});

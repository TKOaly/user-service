process.env.NODE_ENV = "test";

import chai = require("chai");
import "mocha";
import Payment from "../../src/models/Payment";

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
      valid_until: new Date(2020, 1, 1),
      membership_applied_for: "ulkojasen",
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
    payment.created.toDateString().should.equal(new Date(2018, 1, 1).toDateString());
    payment.valid_until.toDateString().should.equal(new Date(2020, 1, 1).toDateString());
    payment.paid.toDateString().should.equal(new Date(2018, 1, 1).toDateString());
    done();
  });

  it("Throws an exception when base number is too long", done => {
    payment.id = 1111111111111111111111111111;
    chai.expect(payment.generateReferenceNumber.bind(payment)).to.throw("baseNumber too long or short");
    done();
  });

  it("Generates a correct reference number", done => {
    payment.generateReferenceNumber();
    payment.reference_number.should.equal("1012");

    payment.id = 32487238;
    payment.generateReferenceNumber();
    payment.reference_number.should.equal("10324872386");

    done();
  });
});

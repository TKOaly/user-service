import { describe, test, beforeEach, expect } from "vitest";
import Payment from "../../src/models/Payment";

process.env.NODE_ENV = "test";

let payment: Payment;

describe("Payment model", () => {
  beforeEach(() => {
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
  });

  test("Sets data correctly", () => {
    expect(payment).toMatchObject({
      id: 1,
      amount: 50.55,
      confirmer_id: 2,
      payer_id: 1,
      payment_type: "jasenmaksu",
      reference_number: "12345678",
      created: expect.any(Date),
      valid_until: expect.any(Date),
      paid: expect.any(Date),
    });

    expect(payment.created.toDateString()).to.equal(new Date(2018, 1, 1).toDateString());
    expect(payment.valid_until.toDateString()).to.equal(new Date(2020, 1, 1).toDateString());
    expect(payment.paid.toDateString()).to.equal(new Date(2018, 1, 1).toDateString());
  });

  test("Throws an exception when base number is too long", () => {
    payment.id = 1111111111111111111111111111;
    expect(payment.generateReferenceNumber.bind(payment)).to.throw("baseNumber too long or short");
  });

  test("Generates a correct reference number", () => {
    payment.generateReferenceNumber();
    expect(payment.reference_number).to.equal("1012");

    payment.id = 32487238;
    payment.generateReferenceNumber();
    expect(payment.reference_number).to.equal("10324872386");
  });
});

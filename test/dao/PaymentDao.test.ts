import { describe, test, beforeEach, afterEach, expect } from "vitest";
import { knexInstance } from "../../src/Db";
import PaymentDao from "../../src/dao/PaymentDao";

process.env.NODE_ENV = "test";

describe("PaymentDao", () => {
  // Roll back
  beforeEach(async () => {
    await knexInstance.migrate.rollback();
    await knexInstance.migrate.latest();
    await knexInstance.seed.run();
  });

  // After each
  afterEach(async () => {
    await knexInstance.migrate.rollback();
  });

  test("Should return a single payment", async () => {
    const payment = await PaymentDao.findOne(1);
    if (payment === undefined) {
      throw new Error("Payment not found");
    }
    expect(payment.id).to.equal(1);
    expect(payment.payer_id).to.equal(1);
    expect(payment.confirmer_id).to.equal(1);
    expect(payment.created.toISOString()).to.equal("2016-02-01T00:00:00.000Z");
    expect(payment.reference_number).to.equal("123456789");
    expect(payment.amount).to.equal("55.55");
    expect(payment.valid_until.toISOString()).to.equal("2019-02-01T00:00:00.000Z");
    expect(payment.paid.toISOString()).to.equal("2016-02-01T00:00:00.000Z");
    expect(payment.payment_type).to.equal("jasenmaksu");
    expect(payment.membership_applied_for).to.equal("jasen");
  });

  test("Should return all payments", async () => {
    const payments = await PaymentDao.findAll();
    expect(payments.length).to.equal(2);

    expect(payments[0].id).to.equal(1);
    expect(payments[0].payer_id).to.equal(1);
    expect(payments[0].confirmer_id).to.equal(1);
    expect(payments[0].created.toISOString()).to.equal("2016-02-01T00:00:00.000Z");
    expect(payments[0].reference_number).to.equal("123456789");
    expect(payments[0].amount).to.equal("55.55");
    expect(payments[0].valid_until.toISOString()).to.equal("2019-02-01T00:00:00.000Z");
    expect(payments[0].paid.toISOString()).to.equal("2016-02-01T00:00:00.000Z");
    expect(payments[0].payment_type).to.equal("jasenmaksu");
    expect(payments[0].membership_applied_for).to.equal("jasen");

    expect(payments[1].id).to.equal(2);
    expect(payments[1].payer_id).to.equal(2);
    expect(payments[1].confirmer_id).to.equal(1);
    expect(payments[1].created.toISOString()).to.equal("2015-02-01T00:00:00.000Z");
    expect(payments[1].reference_number).to.equal("234567890");
    expect(payments[1].amount).to.equal("44.44");
    expect(payments[1].valid_until.toISOString()).to.equal("2018-02-01T00:00:00.000Z");
    expect(payments[1].paid.toISOString()).to.equal("2015-02-01T00:00:00.000Z");
    expect(payments[1].payment_type).to.equal("jasenmaksu");
    expect(payments[1].membership_applied_for).to.equal("jasen");
  });

  test("Should remove a payment", async () => {
    const payments = await PaymentDao.findAll();
    expect(payments.length).to.equal(2);
    const affectedRows = await PaymentDao.remove(2);
    expect(affectedRows).to.equal(1);
    const payments2 = await PaymentDao.findAll();
    expect(payments2.length).to.equal(1);
  });

  test("Should return zero affected rows if trying to remove a payment that does not exist", async () => {
    const affectedRows = await PaymentDao.remove(999);
    expect(affectedRows).to.equal(0);
  });

  test("Should return undefined if payment is not found", async () => {
    const payment = await PaymentDao.findOne(999);
    expect(payment).not.toBeDefined();
  });
});

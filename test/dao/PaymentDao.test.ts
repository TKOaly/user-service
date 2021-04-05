import "mocha";
import chai from "chai";
import { knexInstance } from "../../src/Db";
import PaymentDao from "../../src/dao/PaymentDao";

process.env.NODE_ENV = "test";
const should = chai.should();

describe("PaymentDao", () => {
  // Roll back
  beforeEach(done => {
    knexInstance.migrate.rollback().then(() => {
      knexInstance.migrate.latest().then(() => {
        knexInstance.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach(done => {
    knexInstance.migrate.rollback().then(() => {
      done();
    });
  });

  it("Should return a single payment", async () => {
    const payment = await PaymentDao.findOne(1);
    if (payment === undefined) {
      throw new Error("Payment not found");
    }
    payment.id.should.equal(1);
    payment.payer_id.should.equal(1);
    payment.confirmer_id.should.equal(1);
    payment.created.toISOString().should.equal("2016-02-01T00:00:00.000Z");
    payment.reference_number.should.equal("123456789");
    payment.amount.should.equal("55.55");
    payment.valid_until.toISOString().should.equal("2019-02-01T00:00:00.000Z");
    payment.paid.toISOString().should.equal("2016-02-01T00:00:00.000Z");
    payment.payment_type.should.equal("jasenmaksu");
    payment.membership_applied_for.should.equal("jasen");
  });

  it("Should return all payments", async () => {
    const payments = await PaymentDao.findAll();
    payments.length.should.equal(2);

    payments[0].id.should.equal(1);
    payments[0].payer_id.should.equal(1);
    payments[0].confirmer_id.should.equal(1);
    payments[0].created.toISOString().should.equal("2016-02-01T00:00:00.000Z");
    payments[0].reference_number.should.equal("123456789");
    payments[0].amount.should.equal("55.55");
    payments[0].valid_until.toISOString().should.equal("2019-02-01T00:00:00.000Z");
    payments[0].paid.toISOString().should.equal("2016-02-01T00:00:00.000Z");
    payments[0].payment_type.should.equal("jasenmaksu");
    payments[0].membership_applied_for.should.equal("jasen");

    payments[1].id.should.equal(2);
    payments[1].payer_id.should.equal(2);
    payments[1].confirmer_id.should.equal(1);
    payments[1].created.toISOString().should.equal("2015-02-01T00:00:00.000Z");
    payments[1].reference_number.should.equal("234567890");
    payments[1].amount.should.equal("44.44");
    payments[1].valid_until.toISOString().should.equal("2018-02-01T00:00:00.000Z");
    payments[1].paid.toISOString().should.equal("2015-02-01T00:00:00.000Z");
    payments[1].payment_type.should.equal("jasenmaksu");
    payments[1].membership_applied_for.should.equal("jasen");
  });

  it("Should remove a payment", async () => {
    const payments = await PaymentDao.findAll();
    payments.length.should.equal(2);
    const affectedRows = await PaymentDao.remove(2);
    affectedRows.should.equal(1);
    const payments2 = await PaymentDao.findAll();
    payments2.length.should.equal(1);
  });

  it("Should return zero affected rows if trying to remove a payment that does not exist", async () => {
    const affectedRows = await PaymentDao.remove(999);
    affectedRows.should.equal(0);
  });

  it("Should return undefined if payment is not found", async () => {
    const payment = await PaymentDao.findOne(999);
    should.not.exist(payment);
  });
});

process.env.NODE_ENV = "test";

import chai = require("chai");
import chaiHttp from "chai-http";
import * as JWT from "jsonwebtoken";
import Knex from "knex";
import "mocha";
// Knexfile
import * as knexfile from "../../knexfile";
import payments from "../../seeds/seedData/payments";
import app from "../../src/App";
import { IPayment } from "../../src/models/Payment";

// Knex instance
const knex: Knex = Knex(knexfile.test);

const should: Chai.Should = chai.should();

chai.use(chaiHttp);

const url: string = "/api/payments";

const kjyrIdentifier: string = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
const calendarIdentifier: string = "65a0058d-f9da-4e76-a00a-6013300cab5f";

const generateToken = (
  userId: number,
  authenticatedTo: string[] = [kjyrIdentifier, calendarIdentifier],
  createdAt: Date = new Date(),
): string =>
  JWT.sign(
    {
      userId,
      authenticatedTo: authenticatedTo.join(","),
      createdAt,
    },
    process.env.JWT_SECRET,
  );

describe("PaymentController", () => {
  // Roll back
  beforeEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  // After each
  afterEach((done: Mocha.Done) => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  describe("Returns all payments", () => {
    it("GET /api/payments : As an authenticated user, returns all payments", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url)
        .set("Authorization", "Bearer " + generateToken(2))
        .end((err, res) => {
          should.not.exist(err);
          should.exist(res.body.ok);
          should.exist(res.body.payload);
          should.not.exist(res.body.message);
          res.status.should.equal(200);
          res.body.payload.length.should.equal(payments.length);
          res.body.ok.should.equal(true);

          for (let i: number = 0; i < res.body.payload.length; i++) {
            should.exist(res.body.payload[i]);
            should.exist(res.body.payload[i].id);
            should.exist(res.body.payload[i].payer_id);
            should.exist(res.body.payload[i].confirmer_id);
            should.exist(res.body.payload[i].created);
            should.exist(res.body.payload[i].reference_number);
            should.exist(res.body.payload[i].amount);
            should.exist(res.body.payload[i].valid_until);
            should.exist(res.body.payload[i].paid);
            should.exist(res.body.payload[i].payment_type);

            const payment_2: IPayment = payments[i];
            res.body.payload[i].id.should.equal(payment_2.id);
            res.body.payload[i].payer_id.should.equal(payment_2.payer_id);
            res.body.payload[i].confirmer_id.should.equal(payment_2.confirmer_id);
            Date.parse(res.body.payload[i].created).should.equal(Date.parse(payment_2.created.toLocaleDateString()));
            res.body.payload[i].reference_number.should.equal(payment_2.reference_number);
            parseFloat(res.body.payload[i].amount).should.equal(payment_2.amount);
            Date.parse(res.body.payload[i].valid_until).should.equal(
              Date.parse(payment_2.valid_until.toLocaleDateString()),
            );
            Date.parse(res.body.payload[i].paid).should.equal(Date.parse(payment_2.paid.toLocaleDateString()));
            res.body.payload[i].payment_type.should.equal(payment_2.payment_type);
          }
          done();
        });
    });

    it("GET /api/payments : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url)
        .end((_, res) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });
  });

  describe("Returns a single payment", () => {
    it("GET /api/payments/{id} : As an authenticated user, returns a single payment", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1))
        .end((_, res) => {
          res.status.should.equal(200);
          should.exist(res.body.ok);
          should.exist(res.body.payload);
          should.not.exist(res.body.message);
          should.exist(res.body.payload.id);
          should.exist(res.body.payload.payer_id);
          should.exist(res.body.payload.confirmer_id);
          should.exist(res.body.payload.created);
          should.exist(res.body.payload.reference_number);
          should.exist(res.body.payload.amount);
          should.exist(res.body.payload.valid_until);
          should.exist(res.body.payload.paid);
          should.exist(res.body.payload.payment_type);
          res.body.ok.should.equal(true);
          const payment_2: IPayment = payments[0];
          res.body.payload.id.should.equal(payment_2.id);
          res.body.payload.payer_id.should.equal(payment_2.payer_id);
          res.body.payload.confirmer_id.should.equal(payment_2.confirmer_id);
          Date.parse(res.body.payload.created).should.equal(Date.parse(payment_2.created.toLocaleDateString()));
          res.body.payload.reference_number.should.equal(payment_2.reference_number);
          parseFloat(res.body.payload.amount).should.equal(payment_2.amount);
          Date.parse(res.body.payload.valid_until).should.equal(Date.parse(payment_2.valid_until.toLocaleDateString()));
          Date.parse(res.body.payload.paid).should.equal(Date.parse(payment_2.paid.toLocaleDateString()));
          res.body.payload.payment_type.should.equal(payment_2.payment_type);
          done();
        });
    });

    it("GET /api/payments/{id} : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      chai
        .request(app)
        .get(url + "/1")
        .end((_, res) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });
  });

  describe("Adds a new payment", () => {
    it("POST /api/payments : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      const newPayment: IPayment = {
        payer_id: 2,
        confirmer_id: 1,
        created: new Date(2013, 1, 1),
        amount: 44.44,
        valid_until: new Date(2018, 1, 1),
        paid: new Date(2013, 1, 1),
        payment_type: "jasenmaksu",
      };
      chai
        .request(app)
        .post(url)
        .send(newPayment)
        .end((_, res) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });

    it("POST /api/payments : As an authenticated user, adds a new payment", (done: Mocha.Done) => {
      const newPayment = {
        payer_id: 2,
        amount: 44.44,
        valid_until: "2018-05-28 22:25:4",
        payment_type: "jasenmaksu",
      };
      chai
        .request(app)
        .post(url)
        .set("Authorization", "Bearer " + generateToken(2))
        .send(newPayment)
        .end((_, res) => {
          res.status.should.equal(201);
          should.exist(res.body.ok);
          should.exist(res.body.payload);
          should.exist(res.body.payload.id);
          should.exist(res.body.payload.payer_id);
          should.exist(res.body.payload.created);
          should.not.exist(res.body.payload.reference_number);
          should.exist(res.body.payload.amount);
          should.exist(res.body.payload.valid_until);
          should.exist(res.body.payload.payment_type);
          res.body.ok.should.equal(true);
          res.body.message.should.equal("Payment created");
          res.body.payload.id.should.equal(payments.length + 1);
          res.body.payload.payer_id.should.equal(newPayment.payer_id);
          parseFloat(res.body.payload.amount).should.equal(newPayment.amount);
          res.body.payload.payment_type.should.equal(newPayment.payment_type);

          // Next, get all post and check for a match
          chai
            .request(app)
            .get(url)
            .set("Authorization", "Bearer " + generateToken(2))
            .end((err, res) => {
              should.not.exist(err);
              should.exist(res.body.ok);
              should.exist(res.body.payload);
              should.not.exist(res.body.message);
              res.status.should.equal(200);
              // Check addition of post
              res.body.payload.length.should.equal(payments.length + 1);
              res.body.ok.should.equal(true);

              // Loop through
              // Old entries
              for (let i: number = 0; i < res.body.payload.length - 1; i++) {
                should.exist(res.body.payload[i]);
                should.exist(res.body.payload[i].id);
                should.exist(res.body.payload[i].payer_id);
                should.exist(res.body.payload[i].confirmer_id);
                should.exist(res.body.payload[i].created);
                should.exist(res.body.payload[i].reference_number);
                should.exist(res.body.payload[i].amount);
                should.exist(res.body.payload[i].valid_until);
                should.exist(res.body.payload[i].paid);
                should.exist(res.body.payload[i].payment_type);

                const payment_2: IPayment = payments[i];
                res.body.payload[i].id.should.equal(payment_2.id);
                res.body.payload[i].payer_id.should.equal(payment_2.payer_id);
                res.body.payload[i].confirmer_id.should.equal(payment_2.confirmer_id);
                /*Date.parse(res.body.payload[i].created).should.equal(
                  Date.parse(payment_2.created.toLocaleDateString())
                );*/
                parseFloat(res.body.payload[i].amount).should.equal(payment_2.amount);
                /*Date.parse(res.body.payload[i].valid_until).should.equal(
                  Date.parse(payment_2.valid_until.toLocaleDateString())
                );
                Date.parse(res.body.payload[i].paid).should.equal(
                  Date.parse(payment_2.paid.toLocaleDateString())
                );*/
                res.body.payload[i].payment_type.should.equal(payment_2.payment_type);
              }

              // New entry
              const payment_2 = res.body.payload[2];
              payment_2.id.should.equal(3);
              payment_2.payer_id.should.equal(newPayment.payer_id);
              /*Date.parse(payment_2.created).should.equal(
                Date.parse(newPayment.created.toLocaleDateString())
              );*/
              parseFloat(payment_2.amount).should.equal(newPayment.amount);
              /*Date.parse(payment_2.valid_until).should.equal(
                Date.parse(newPayment.valid_until.toLocaleDateString())
              );
              Date.parse(payment_2.paid).should.equal(
                Date.parse(newPayment.paid.toLocaleDateString())
              );*/
              payment_2.payment_type.should.equal(newPayment.payment_type);
              done();
            });
        });
    });
  });

  describe("Modifies a payment", () => {
    it("PATCH /api/payments/{id} : As an authenticated user, can modify a payment with valid information", (done: Mocha.Done) => {
      // First, fetch a payment that will be modified.
      chai
        .request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1))
        .end((_, res) => {
          const payment: IPayment = res.body.payload;
          // Set reference number and payment type, except them to be changed
          const newRefNum: string = "00000001111111";
          const newPaymentType: string = "HelloWorld";
          // Then, do a PATCH request
          chai
            .request(app)
            .patch(url + "/" + payment.id)
            .set("Authorization", "Bearer " + generateToken(1))
            .send(
              Object.assign({}, payment, {
                reference_number: newRefNum,
                payment_type: newPaymentType,
              }),
            )
            .end((_, res) => {
              should.exist(res.body.ok);
              should.exist(res.body.message);
              should.exist(res.body.payload);
              should.exist(res.body.payload.id);
              should.exist(res.body.payload.payer_id);
              should.exist(res.body.payload.created);
              should.exist(res.body.payload.reference_number);
              should.exist(res.body.payload.amount);
              should.exist(res.body.payload.valid_until);
              should.exist(res.body.payload.paid);
              should.exist(res.body.payload.payment_type);
              res.body.payload.payment_type.should.equal(newPaymentType);
              res.body.payload.reference_number.should.equal(newRefNum);
              res.status.should.equal(200);
              res.body.ok.should.equal(true);
              res.body.message.should.equal("Payment modified");
              done();
            });
        });
    });

    it("PATCH /api/payments/{id} : As an unauthenticated user, returns unauthorized", (done: Mocha.Done) => {
      const newPayment: IPayment = {
        id: 1,
        payer_id: 2,
        confirmer_id: 1,
        created: new Date(2013, 1, 1),
        reference_number: "1212121212",
        amount: 44.44,
        valid_until: new Date(2018, 1, 1),
        paid: new Date(2013, 1, 1),
        payment_type: "jasenmaksu",
      };
      chai
        .request(app)
        .patch(url + "/" + newPayment.id)
        .send(newPayment)
        .end((_, res) => {
          should.exist(res.body.ok);
          should.exist(res.body.message);
          should.not.exist(res.body.payload);
          res.body.ok.should.equal(false);
          res.body.message.should.equal("Unauthorized");
          res.status.should.equal(401);
          done();
        });
    });

    it("PATCH /api/payments/{id} : As an unauthenticated user, cannot modify a payment, with missing request parameters", (done: Mocha.Done) => {
      // First, fetch a payment that will be modified.
      chai
        .request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1))
        .end((_, res) => {
          const payment: IPayment = {
            id: res.body.payload.id,
            amount: res.body.payload.amount,
            confirmer_id: res.body.payload.confirmer_id,
            created: res.body.payload.created,
            paid: res.body.payload.created,
            payer_id: res.body.payload.payer_id,
            payment_type: res.body.payload.payment_type,
            reference_number: res.body.payload.payment_type,
            valid_until: res.body.payload.valid_until,
          };
          // Set reference number and payment type, except them to be changed
          const newRefNum: string = "00000001111111";
          const newPaymentType: string = "HelloWorld";

          // PATCH excepts all object params to exist
          delete payment.confirmer_id;

          // Then, do a PATCH request
          chai
            .request(app)
            .patch(url + "/" + payment.id)
            .set("Authorization", "Bearer " + generateToken(1))
            .send(
              Object.assign({}, payment, {
                reference_number: newRefNum,
                payment_type: newPaymentType,
              }),
            )
            .end((_, res) => {
              should.exist(res.body.ok);
              should.exist(res.body.message);
              should.not.exist(res.body.payload);
              res.status.should.equal(400);
              res.body.ok.should.equal(false);
              res.body.message.should.equal("Failed to modify payment: missing request parameters");
              done();
            });
        });
    });
  });
});

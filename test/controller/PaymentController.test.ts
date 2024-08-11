import { describe, test, beforeEach, afterEach, expect } from "vitest";
import * as JWT from "jsonwebtoken";
import payments from "../../seeds/seedData/payments";
import request from "supertest";
import app from "../../src/App";
import { PaymentDatabaseObject } from "../../src/models/Payment";
import { knexInstance as knex } from "../../src/Db";

process.env.NODE_ENV = "test";

const url = "/api/payments";

const kjyrIdentifier = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
const calendarIdentifier = "65a0058d-f9da-4e76-a00a-6013300cab5f";

const generateToken = (
  userId: number,
  authenticatedTo = [kjyrIdentifier, calendarIdentifier],
  createdAt = new Date(),
): string =>
  JWT.sign(
    {
      userId,
      authenticatedTo: authenticatedTo.join(","),
      createdAt,
    },
    process.env.JWT_SECRET || "secret",
  );

describe("PaymentController", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await knex.migrate.rollback();
  });

  describe("Returns all payments", () => {
    test("GET /api/payments : As an authenticated user, returns all payments", async () => {
      const res = await request(app)
        .get(url)
        .set("Authorization", "Bearer " + generateToken(2))

      expect(res.body.ok).toBeDefined();
      expect(res.body.payload).toBeDefined();
      expect(res.body.message).toBeNull();
      expect(res.status).to.equal(200);
      expect(res.body.payload.length).to.equal(payments.length);
      expect(res.body.ok).to.equal(true);

      for (let i = 0; i < res.body.payload.length; i++) {
        expect(res.body.payload[i]).toBeDefined();
        expect(res.body.payload[i].id).toBeDefined();
        expect(res.body.payload[i].payer_id).toBeDefined();
        expect(res.body.payload[i].confirmer_id).toBeDefined();
        expect(res.body.payload[i].created).toBeDefined();
        expect(res.body.payload[i].reference_number).toBeDefined();
        expect(res.body.payload[i].amount).toBeDefined();
        expect(res.body.payload[i].valid_until).toBeDefined();
        expect(res.body.payload[i].paid).toBeDefined();
        expect(res.body.payload[i].payment_type).toBeDefined();

        const payment_2: PaymentDatabaseObject = payments[i];
        expect(res.body.payload[i].id).to.equal(payment_2.id);
        expect(res.body.payload[i].payer_id).to.equal(payment_2.payer_id);
        expect(res.body.payload[i].confirmer_id).to.equal(payment_2.confirmer_id);
        expect(Date.parse(res.body.payload[i].created)).to.equal(Date.parse(payment_2.created!.toLocaleDateString()));
        expect(res.body.payload[i].reference_number).to.equal(payment_2.reference_number);
        expect(parseFloat(res.body.payload[i].amount)).to.equal(payment_2.amount);
        expect(Date.parse(res.body.payload[i].valid_until)).to.equal(Date.parse(payment_2.valid_until!.toLocaleDateString()));
        expect(Date.parse(res.body.payload[i].paid)).to.equal(Date.parse(payment_2.paid!.toLocaleDateString()));
        expect(res.body.payload[i].payment_type).to.equal(payment_2.payment_type);
      }
    });

    test("GET /api/payments : As an unauthenticated user, returns unauthorized", async () => {
      const res = await request(app)
        .get(url)

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });
  });

  describe("Returns a single payment", () => {
    test("GET /api/payments/{id} : As an authenticated user, returns a single payment", async () => {
      const res = await request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1));

      expect(res.status).to.equal(200);
      expect(res.body.ok).toBeDefined();
      expect(res.body.payload).toBeDefined();
      expect(res.body.message).toBeNull();
      expect(res.body.payload.id).toBeDefined();
      expect(res.body.payload.payer_id).toBeDefined();
      expect(res.body.payload.confirmer_id).toBeDefined();
      expect(res.body.payload.created).toBeDefined();
      expect(res.body.payload.reference_number).toBeDefined();
      expect(res.body.payload.amount).toBeDefined();
      expect(res.body.payload.valid_until).toBeDefined();
      expect(res.body.payload.paid).toBeDefined();
      expect(res.body.payload.payment_type).toBeDefined();
      expect(res.body.ok).to.equal(true);
      const payment_2: PaymentDatabaseObject = payments[0];
      expect(res.body.payload.id).to.equal(payment_2.id);
      expect(res.body.payload.payer_id).to.equal(payment_2.payer_id);
      expect(res.body.payload.confirmer_id).to.equal(payment_2.confirmer_id);
      expect(Date.parse(res.body.payload.created)).to.equal(Date.parse(payment_2.created!.toLocaleDateString()));
      expect(res.body.payload.reference_number).to.equal(payment_2.reference_number);
      expect(parseFloat(res.body.payload.amount)).to.equal(payment_2.amount);
      expect(Date.parse(res.body.payload.valid_until)).to.equal(Date.parse(payment_2.valid_until!.toLocaleDateString()));
      expect(Date.parse(res.body.payload.paid)).to.equal(Date.parse(payment_2.paid!.toLocaleDateString()));
      expect(res.body.payload.payment_type).to.equal(payment_2.payment_type);
    });

    test("GET /api/payments/{id} : As an unauthenticated user, returns unauthorized", async () => {
      const res = await request(app)
        .get(url + "/1");

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });
  });

  describe("Adds a new payment", () => {
    test("POST /api/payments : As an unauthenticated user, returns unauthorized", async () => {
      const newPayment: Omit<PaymentDatabaseObject, "id"> = {
        payer_id: 2,
        confirmer_id: 1,
        created: new Date(2013, 1, 1),
        amount: 44.44,
        valid_until: new Date(2018, 1, 1),
        paid: new Date(2013, 1, 1),
        payment_type: "jasenmaksu",
        membership_applied_for: "jasen",
        reference_number: "123456789",
      };
      const res = await request(app)
        .post(url)
        .send(newPayment);

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });

    test("POST /api/payments : As an authenticated user, adds a new payment", async () => {
      const newPayment = {
        payer_id: 2,
        seasons: 3,
        payment_type: "tilisiirto",
        membership_applied_for: "jasen",
      };

      const res1 = await request(app)
        .post(url)
        .set("Authorization", "Bearer " + generateToken(2))
        .send(newPayment);

      expect(res1.status).to.equal(201);
      expect(res1.body.ok).toBeDefined();
      expect(res1.body.payload).toBeDefined();
      expect(res1.body.payload.id).toBeDefined();
      expect(res1.body.payload.payer_id).toBeDefined();
      expect(res1.body.payload.created).toBeDefined();
      expect(res1.body.payload.reference_number).toBeDefined();
      expect(res1.body.payload.amount).toBeDefined();
      expect(res1.body.payload.valid_until).toBeDefined();
      expect(res1.body.payload.payment_type).toBeDefined();
      expect(res1.body.ok).to.equal(true);
      expect(res1.body.message).to.equal("Payment created");
      expect(res1.body.payload.id).to.equal(payments.length + 1);
      expect(res1.body.payload.payer_id).to.equal(newPayment.payer_id);
      expect(parseFloat(res1.body.payload.amount)).to.equal(10);
      expect(res1.body.payload.payment_type).to.equal(newPayment.payment_type);

      const endDate = new Date();

      endDate.setMonth(6);
      endDate.setDate(31);
      endDate.setHours(23);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      endDate.setMilliseconds(0);

      if (endDate.valueOf() >= Date.now()) {
        endDate.setFullYear(endDate.getFullYear() - 1);
      }

      endDate.setFullYear(endDate.getFullYear() + newPayment.seasons);

      expect(res1.body.payload.valid_until).to.equal(endDate.toISOString());

      // Next, get all post and check for a match
      const res2 = await request(app)
        .get(url)
        .set("Authorization", "Bearer " + generateToken(2));

      expect(res2.body.ok).toBeDefined();
      expect(res2.body.payload).toBeDefined();
      expect(res2.body.message).toBeNull();
      expect(res2.status).to.equal(200);
      // Check addition of post
      expect(res2.body.payload.length).to.equal(payments.length + 1);
      expect(res2.body.ok).to.equal(true);

      // Loop through
      // Old entries
      for (let i = 0; i < res2.body.payload.length - 1; i++) {
        expect(res2.body.payload[i]).toBeDefined();
        expect(res2.body.payload[i].id).toBeDefined();
        expect(res2.body.payload[i].payer_id).toBeDefined();
        expect(res2.body.payload[i].confirmer_id).toBeDefined();
        expect(res2.body.payload[i].created).toBeDefined();
        expect(res2.body.payload[i].reference_number).toBeDefined();
        expect(res2.body.payload[i].amount).toBeDefined();
        expect(res2.body.payload[i].valid_until).toBeDefined();
        expect(res2.body.payload[i].paid).toBeDefined();
        expect(res2.body.payload[i].payment_type).toBeDefined();

        const payment_2: PaymentDatabaseObject = payments[i];
        expect(res2.body.payload[i].id).to.equal(payment_2.id);
        expect(res2.body.payload[i].payer_id).to.equal(payment_2.payer_id);
        expect(res2.body.payload[i].confirmer_id).to.equal(payment_2.confirmer_id);
        /* Date.parse(res2.body.payload[i].created).should.equal(
          Date.parse(payment_2.created.toLocaleDateString())
        ); */
        expect(parseFloat(res2.body.payload[i].amount)).to.equal(payment_2.amount);
        /* Date.parse(res2.body.payload[i].valid_until).should.equal(
          Date.parse(payment_2.valid_until.toLocaleDateString())
        );
        Date.parse(res2.body.payload[i].paid).should.equal(
          Date.parse(payment_2.paid.toLocaleDateString())
        ); */
        expect(res2.body.payload[i].payment_type).to.equal(payment_2.payment_type);
      }

      // New entry
      const payment_2 = res2.body.payload[2];
      expect(payment_2.id).to.equal(3);
      expect(payment_2.payer_id).to.equal(newPayment.payer_id);
      /* Date.parse(payment_2.created).should.equal(
        Date.parse(newPayment.created.toLocaleDateString())
      ); */
      expect(parseFloat(payment_2.amount)).to.equal(10);
      /* Date.parse(payment_2.valid_until).should.equal(
        Date.parse(newPayment.valid_until.toLocaleDateString())
      );
      Date.parse(payment_2.paid).should.equal(
        Date.parse(newPayment.paid.toLocaleDateString())
      ); */
      expect(payment_2.payment_type).to.equal(newPayment.payment_type);
    });
  });

  describe("Modifies a payment", () => {
    test("PATCH /api/payments/{id} : As an authenticated user, can modify a payment with valid information", async () => {
      // First, fetch a payment that will be modified.
      const res1 = await request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1));

      const payment: PaymentDatabaseObject = res1.body.payload;
      // Set reference number and payment type, except them to be changed
      const newRefNum = "00000001111111";
      const newPaymentType = "HelloWorld";
      // Then, do a PATCH request
      const res2 = await request(app)
        .patch(url + "/" + payment.id)
        .set("Authorization", "Bearer " + generateToken(1))
        .send(
          Object.assign({}, payment, {
            reference_number: newRefNum,
            payment_type: newPaymentType,
          }),
        );

      expect(res2.body.ok).toBeDefined();
      expect(res2.body.message).toBeDefined();
      expect(res2.body.payload).toBeDefined();
      expect(res2.body.payload.id).toBeDefined();
      expect(res2.body.payload.payer_id).toBeDefined();
      expect(res2.body.payload.created).toBeDefined();
      expect(res2.body.payload.reference_number).toBeDefined();
      expect(res2.body.payload.amount).toBeDefined();
      expect(res2.body.payload.valid_until).toBeDefined();
      expect(res2.body.payload.paid).toBeDefined();
      expect(res2.body.payload.payment_type).toBeDefined();
      expect(res2.body.payload.payment_type).to.equal(newPaymentType);
      expect(res2.body.payload.reference_number).to.equal(newRefNum);
      expect(res2.status).to.equal(200);
      expect(res2.body.ok).to.equal(true);
      expect(res2.body.message).to.equal("Payment modified");
    });

    test("PATCH /api/payments/{id} : As an unauthenticated user, returns unauthorized", async () => {
      const newPayment: PaymentDatabaseObject = {
        id: 1,
        payer_id: 2,
        confirmer_id: 1,
        created: new Date(2013, 1, 1),
        reference_number: "1212121212",
        amount: 44.44,
        valid_until: new Date(2018, 1, 1),
        paid: new Date(2013, 1, 1),
        payment_type: "jasenmaksu",
        membership_applied_for: "jasen",
      };

      const res = await request(app)
        .patch(url + "/" + newPayment.id)
        .send(newPayment);

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });

    test("PATCH /api/payments/{id} : As an unauthenticated user, cannot modify a payment, with missing request parameters", async () => {
      // First, fetch a payment that will be modified.
      const res1 = await request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(1));

      const payment: PaymentDatabaseObject = {
        id: res1.body.payload.id,
        amount: res1.body.payload.amount,
        confirmer_id: res1.body.payload.confirmer_id,
        created: res1.body.payload.created,
        paid: res1.body.payload.created,
        payer_id: res1.body.payload.payer_id,
        payment_type: res1.body.payload.payment_type,
        reference_number: res1.body.payload.payment_type,
        valid_until: res1.body.payload.valid_until,
        membership_applied_for: res1.body.payload.membership_applied_for,
      };
      // Set reference number and payment type, except them to be changed
      const newRefNum = "00000001111111";
      const newPaymentType = "HelloWorld";

      // PATCH excepts all object params to exist
      // @ts-expect-error
      delete payment.confirmer_id;

      // Then, do a PATCH request
      const res2 = await request(app)
        .patch(url + "/" + payment.id)
        .set("Authorization", "Bearer " + generateToken(1))
        .send(
          Object.assign({}, payment, {
            reference_number: newRefNum,
            payment_type: newPaymentType,
          }),
        );

      expect(res2.body.ok).toBeDefined();
      expect(res2.body.message).toBeDefined();
      expect(res2.body.payload).toBeNull();
      expect(res2.status).to.equal(400);
      expect(res2.body.ok).to.equal(false);
      expect(res2.body.message).to.equal("Failed to modify payment: missing request parameters");
    });
  });
});

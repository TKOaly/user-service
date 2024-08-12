import { describe, test, beforeEach, afterEach, expect } from "vitest";
import request from "supertest";
import app from "../../src/App";
import { kjyrIdentifier } from "../TestUtils";
import { knexInstance as knex } from "../../src/Db";

process.env.NODE_ENV = "test";

const policyUrl = "/api/policy";

describe("PrivacyPolicyController", () => {
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

  describe("Privacy policy route", () => {
    test("GET /api/policy/KJYR_SERVICE_IDENTIFIER : Returns an existing privacy policy for KJYR", async () => {
      const response = await request(app)
        .get(`${policyUrl}/${kjyrIdentifier}`)

      expect(response.ok).toBeTruthy();
      expect(response.status).to.equal(200);

      expect(response.body).toMatchObject({
        ok: true,
        payload: {
          text: "KJYR privacy policy",
          service_id: 2,
          id: 2,
          modified: expect.any(String),
          created: expect.any(String),
        },
      })
    });

    test("GET /api/policy/something : Returns an error if the privacy policy is not found", async () => {
      const response = await request(app)
        .get(`${policyUrl}/1-2-3-4-5`)

      expect(response.ok).toBeFalsy();
      expect(response.status).to.equal(404);

      expect(response.body).toMatchObject({
        ok: false,
        message: "Privacy policy not found",
        payload: null,
      });
    });
  });
});

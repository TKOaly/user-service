import { describe, test, beforeEach, afterEach, expect } from "vitest";
import request from "supertest";
import app from "../../src/App";
import { knexInstance as knex } from "../../src/Db";
import UserService from "../../src/services/UserService";

process.env.NODE_ENV = "test";

const authUrl = "/api/auth";
const kjyrIdentifier = "433f7cd9-e7db-42fb-aceb-c3716c6ef2b7";
const calendarIdentifier = "65a0058d-f9da-4e76-a00a-6013300cab5f";
const correctCreds: { [value: string]: string } = {
  username: "test_user",
  password: "test_user",
  serviceIdentifier: kjyrIdentifier,
};
const incorrectCreds: { [value: string]: string } = {
  username: "test_user",
  password: "testuser",
  serviceIdentifier: kjyrIdentifier,
};

describe("AuthController", () => {
  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await UserService.stop();
    await knex.migrate.rollback();
  });

  describe("Authentication", () => {
    test("POST /api/auth/authenticate : Authenticates with correct credentials", async () => {
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds);
      expect(res.status).to.equal(200);
      expect(res.body.payload).toBeDefined();
      expect(res.body.payload.token).toBeDefined();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);
    });

    test("POST /api/auth/authenticate : Does not authenticate with incorrect credentials", async () => {
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send(incorrectCreds);
      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.status).to.equal(401);
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Invalid username or password");
    });

    test("POST /api/auth/authenticate : Does not authenticate with missing username", async () => {
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send({
          password: "test",
          serviceIdentifier: kjyrIdentifier,
        });
      expect(res.status).to.equal(400);
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Invalid request params");
    });

    test("POST /api/auth/authenticate : Does not authenticate with missing password", async () => {
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send({
          username: "test",
          serviceIdentifier: kjyrIdentifier,
        });
      expect(res.status).to.equal(400);
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Invalid request params");
    });

    test("POST /api/auth/authenticate : Does not authenticate with missing service identifier", async () => {
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send({
          username: "test",
          password: "test",
        });
      expect(res.status).to.equal(400);
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Invalid request params");
    });

    test(
      "POST /api/auth/authenticate : Returns an error when trying to" + " authenticate with a nonexistent service",
      async () => {
        const res = await request(app)
          .post(authUrl + "/authenticate")
          .send({
            username: "test",
            password: "test",
            serviceIdentifier: "invalidServiceIdentifier",
          });
        expect(res.status).to.equal(404);
        expect(res.body.payload).toBeNull();
        expect(res.body.ok).toBeDefined();
        expect(res.body.ok).to.equal(false);
        expect(res.body.message).to.equal("Service not found");
      },
    );
  });

  describe("Service check", () => {
    test("POST /api/auth/authenticate : " + "Checks that the correct service has been authenticated to", async () => {
      // The default credentials authenticate to KJYR
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds);
      expect(res.status).to.equal(200);
      expect(res.body.payload).toBeDefined();
      expect(res.body.payload.token).toBeDefined();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);

      // Token to be passed forwards
      const token: string = res.body.payload.token;

      // Next, check that the user is authenticated to KJYR (as an example)
      const res2 = await request(app)
        .get(authUrl + "/check")
        .set("Authorization", "Bearer " + token)
        .set("service", kjyrIdentifier);

      expect(res2.status).to.equal(200);
      expect(res2.body.ok).toBeDefined();
      expect(res2.body.message).toBeDefined();
      expect(res2.body.payload).toBeNull();
      expect(res2.body.ok).to.equal(true);
      expect(res2.body.message).to.equal("Success");
    });

    test(
      "POST /api/auth/authenticate : " + "Check that the user has not been authenticated to an incorrect service",
      async () => {
        // The default credentials authenticate to KJYR
        const res = await request(app)
          .post(authUrl + "/authenticate")
          .send(correctCreds);
        expect(res.status).to.equal(200);
        expect(res.body.payload).toBeDefined();
        expect(res.body.payload.token).toBeDefined();
        expect(res.body.ok).toBeDefined();
        expect(res.body.ok).to.equal(true);

        // Token to be passed forwards
        const token: string = res.body.payload.token;

        // Next, check that the user is not authenticated to calendar (as an example)
        const res2 = await request(app)
          .get(authUrl + "/check")
          .set("Authorization", "Bearer " + token)
          .set("service", calendarIdentifier);

        expect(res2.body.ok).toBeDefined();
        expect(res2.body.message).toBeDefined();
        expect(res2.body.payload).toBeNull();
        expect(res2.body.ok).to.equal(false);
        expect(res2.body.message).to.equal("Not authorized to service");
      },
    );

    test("GET /api/auth/check : Can authenticate to multiple services", async () => {
      // First, authenticate to KJYR
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds);

      expect(res.status).to.equal(200);
      expect(res.body.payload).toBeDefined();
      expect(res.body.payload.token).toBeDefined();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);

      // Token
      const token: string = res.body.payload.token;

      // Set calendar token to request
      const secondCreds = {
        ...correctCreds,
        serviceIdentifier: calendarIdentifier,
      };

      // Secondly, authenticate to calendar
      const res2 = await request(app)
        .post(authUrl + "/authenticate")
        .set("Authorization", "Bearer " + token)
        .send(secondCreds);

      expect(res2.status).to.equal(200);
      expect(res2.body.payload).toBeDefined();
      expect(res2.body.payload.token).toBeDefined();
      expect(res2.body.ok).toBeDefined();
      expect(res2.body.ok).to.equal(true);

      const token2: string = res2.body.payload.token;

      // Next, check auth for KJYR
      const res3 = await request(app)
        .get(authUrl + "/check")
        .set("Authorization", "Bearer " + token2)
        .set("service", kjyrIdentifier);

      expect(res3.status).to.equal(200);
      expect(res3.body.ok).toBeDefined();
      expect(res3.body.message).toBeDefined();
      expect(res3.body.payload).toBeNull();
      expect(res3.body.ok).to.equal(true);
      expect(res3.body.message).to.equal("Success");
      // Check calendar permission
      const res4 = await request(app)
        .get(authUrl + "/check")
        .set("Authorization", "Bearer " + token2)
        .set("service", calendarIdentifier);
      expect(res4.status).to.equal(200);
      expect(res4.body.ok).toBeDefined();
      expect(res4.body.message).toBeDefined();
      expect(res4.body.payload).toBeNull();
      expect(res4.body.ok).to.equal(true);
      expect(res4.body.message).to.equal("Success");
    });

    test("GET /api/auth/check : Returns error if service is not defined", async () => {
      // First, authenticate to KJYR
      const res = await request(app)
        .post(authUrl + "/authenticate")
        .send(correctCreds);
      expect(res.status).to.equal(200);
      expect(res.body.payload).toBeDefined();
      expect(res.body.payload.token).toBeDefined();
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);

      // Token
      const token: string = res.body.payload.token;

      // Check auth for kjyr
      const res2 = await request(app)
        .get(authUrl + "/check")
        .set("Authorization", "Bearer " + token);

      expect(res2.status).to.equal(400);
      expect(res2.body.ok).toBeDefined();
      expect(res2.body.message).toBeDefined();
      expect(res2.body.payload).toBeNull();
      expect(res2.body.ok).to.equal(false);
      expect(res2.body.message).to.equal("No service defined");
    });
  });
});

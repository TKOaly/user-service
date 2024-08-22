import { describe, test, beforeEach, afterEach, expect } from "vitest";
import app from "../../src/App";
import request from "supertest";
import users from "../../seeds/seedData/users";
import User, { removeNonRequestedData, removeSensitiveInformation } from "../../src/models/User";
import AuthenticationService from "../../src/services/AuthenticationService";
import { generateToken, kjyrIdentifier } from "../TestUtils";
import { knexInstance as knex } from "../../src/Db";
import Service, { ServiceDatabaseObject } from "../../src/models/Service";
import UserService from "../../src/services/UserService";

process.env.NODE_ENV = "test";

const authService = AuthenticationService;
const url = "/api/users";

describe("UserController", () => {
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

  describe("Returns all users", () => {
    test("GET /api/users : As an authenticated user, returns all users", async () => {
      const res = await request(app)
        .get(url)
        .set("Authorization", "Bearer " + generateToken(2));

      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);
      expect(res.body.payload).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.message).to.equal("Success");
      expect(res.status).to.equal(200);
      expect(res.body.payload.length).to.equal(users.length);
      expect(res.body.ok).to.equal(true);

      res.body.payload.forEach((payloadObject: User, _i: number) => {
        const user_2 = new User(users.find(usr => usr.id === payloadObject.id)!);

        expect(payloadObject.id).toBeDefined();
        expect(payloadObject.id).to.equal(user_2.id);

        expect(payloadObject.createdAt).toBeDefined();

        expect(payloadObject.isDeleted).toBeDefined();
        expect(payloadObject.isDeleted).to.equal(user_2.isDeleted);

        expect(payloadObject.email).toBeDefined();
        expect(payloadObject.email).to.equal(user_2.email);

        expect(payloadObject.isHYYMember).toBeDefined();
        expect(payloadObject.isHYYMember).to.equal(user_2.isHYYMember);

        expect(payloadObject.membership).toBeDefined();
        expect(payloadObject.membership).to.equal(user_2.membership);

        expect(payloadObject.modifiedAt).toBeDefined();

        expect(payloadObject.name).toBeDefined();
        expect(payloadObject.name).to.equal(user_2.name);

        expect(payloadObject.phone).toBeDefined();
        expect(payloadObject.phone).to.equal(user_2.phone);

        expect(payloadObject.residence).toBeDefined();
        expect(payloadObject.residence).to.equal(user_2.residence);

        expect(payloadObject.role).toBeDefined();
        expect(payloadObject.role).to.equal(user_2.role);

        expect(payloadObject.screenName).toBeDefined();
        expect(payloadObject.screenName).to.equal(user_2.screenName);

        expect(payloadObject.isTKTL).toBeDefined();
        expect(payloadObject.isTKTL).to.equal(user_2.isTKTL);

        expect(payloadObject.isHyStaff).toBeDefined();
        expect(payloadObject.isHyStaff).to.equal(user_2.isHyStaff);

        expect(payloadObject.isHyStudent).toBeDefined();
        expect(payloadObject.isHyStudent).to.equal(user_2.isHyStudent);

        expect(payloadObject.username).toBeDefined();
        expect(payloadObject.username).to.equal(user_2.username);
      });
    });

    test("GET /api/users : As an unauthenticated user, returns unauthorized", async () => {
      const res = await request(app).get(url);

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });
  });

  describe("Returns a single user", () => {
    test("GET /api/users/{id} : As an authenticated user, returns a single user", async () => {
      const res = await request(app)
        .get(url + "/1")
        .set("Authorization", "Bearer " + generateToken(2));

      expect(res.status).to.equal(200);
      expect(res.body.ok).toBeDefined();
      expect(res.body.ok).to.equal(true);
      expect(res.body.payload).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.message).to.equal("Success");

      const user_2: User = new User(users.find(user => user.id === 1)!);

      expect(user_2).toBeDefined();

      const payloadObject: User = res.body.payload;

      expect(payloadObject.id).toBeDefined();
      expect(payloadObject.id).to.equal(user_2.id);

      expect(payloadObject.createdAt).toBeDefined();

      expect(payloadObject.isDeleted).toBeDefined();
      expect(payloadObject.isDeleted).to.equal(user_2.isDeleted);

      expect(payloadObject.email).toBeDefined();
      expect(payloadObject.email).to.equal(user_2.email);

      expect(payloadObject.isHYYMember).toBeDefined();
      expect(payloadObject.isHYYMember).to.equal(user_2.isHYYMember);

      expect(payloadObject.membership).toBeDefined();
      expect(payloadObject.membership).to.equal(user_2.membership);

      expect(payloadObject.modifiedAt).toBeDefined();

      expect(payloadObject.name).toBeDefined();
      expect(payloadObject.name).to.equal(user_2.name);

      expect(payloadObject.phone).toBeDefined();
      expect(payloadObject.phone).to.equal(user_2.phone);

      expect(payloadObject.residence).toBeDefined();
      expect(payloadObject.residence).to.equal(user_2.residence);

      expect(payloadObject.role).toBeDefined();
      expect(payloadObject.role).to.equal(user_2.role);

      expect(payloadObject.screenName).toBeDefined();
      expect(payloadObject.screenName).to.equal(user_2.screenName);

      expect(payloadObject.isTKTL).toBeDefined();
      expect(payloadObject.isTKTL).to.equal(user_2.isTKTL);

      expect(payloadObject.username).toBeDefined();
      expect(payloadObject.username).to.equal(user_2.username);

      expect(payloadObject.isHyStaff).toBeDefined();
      expect(payloadObject.isHyStaff).to.equal(user_2.isHyStaff);

      expect(payloadObject.isHyStudent).toBeDefined();
      expect(payloadObject.isHyStudent).to.equal(user_2.isHyStudent);
    });

    test("GET /api/users/{id} : As an unauthenticated user, returns unauthorized", async () => {
      const res = await request(app).get(url + "/1");

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("Unauthorized");
      expect(res.status).to.equal(401);
    });
  });

  describe("Returns my information", () => {
    test("GET /api/users/me : Returns an error if no service is defined", async () => {
      const res = await request(app)
        .get(url + "/me")
        .set("Authorization", "Bearer " + generateToken(1, [kjyrIdentifier]));

      expect(res.body.ok).toBeDefined();
      expect(res.body.message).toBeDefined();
      expect(res.body.payload).toBeNull();
      expect(res.body.ok).to.equal(false);
      expect(res.body.message).to.equal("No service defined");
      expect(res.status).to.equal(400);
    });

    test(
      "GET /api/users/me: Trying to get information from" + " a service the user is not authenticated to",
      async () => {
        const res = await request(app)
          .get(url + "/me")
          .set("Authorization", "Bearer " + generateToken(1, []))
          .set("Service", kjyrIdentifier);

        expect(res.body.ok).toBeDefined();
        expect(res.body.message).toBeDefined();
        expect(res.body.payload).toBeNull();
        expect(res.body.ok).to.equal(false);
        expect(res.body.message).to.equal("User not authorized to service");
        expect(res.status).to.equal(403);
      },
    );

    test(
      "GET /api/users/me : Removes unwanted information" + " and returns my information from every service",
      async () => {
        const dbServices = await authService.getServices();

        const services: ServiceDatabaseObject[] = dbServices.map((dbService: Service) => dbService.getDatabaseObject());

        // Loop through services
        for (const service of services) {
          const serviceIdentifier = service.service_identifier;
          const permissionNumber = service.data_permissions;

          const res = await request(app)
            .get(url + "/me")
            .set("Authorization", "Bearer " + generateToken(1, [serviceIdentifier!]))
            .set("Service", serviceIdentifier!);

          expect(res.status).to.equal(200);
          expect(res.body.ok).toBeDefined();
          expect(res.body.ok).to.equal(true);
          expect(res.body.payload).toBeDefined();
          expect(res.body.message).toBeDefined();
          expect(res.body.message).to.equal("Success");

          const user_2: User = new User(users.find(user => user.id === 1)!);

          expect(user_2).toBeDefined();

          const payloadObject: User = res.body.payload;

          const user = removeSensitiveInformation(new User(user_2.getDatabaseObject()));

          const allFields = Object.keys(user).filter(key => !["createdAt", "modifiedAt"].includes(key));

          const required: string[] = Object.keys(
            removeNonRequestedData(removeSensitiveInformation(user_2), permissionNumber!),
          );
          for (const field of allFields) {
            if (required.find((requiredField: string) => requiredField === field)) {
              // Should expect and equal
              expect(payloadObject[field]).toBeDefined();
              expect(payloadObject[field]).to.equal(user_2[field]);
            } else {
              // Should not exist
              expect(payloadObject).not.toHaveProperty(field);
            }
          }
        }
      },
    );
  });
});

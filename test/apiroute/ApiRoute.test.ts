import { apiHeaderMiddleware, generateApiRoute } from "../../src/utils/ApiRoute";
import { describe, test, expect } from "vitest";
import express from "express";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.API_VERSION = "v5";

describe("ApiRoute", () => {
  test("Creates API route correctly, with API version and route", () => {
    const apiVersion = "v2";
    const route = "testroute";
    const apiUrl = generateApiRoute(route, apiVersion);
    expect(apiUrl).to.equal(`/api/${apiVersion}/${route}`);
  });

  test("Creates API route correctly, with API route", () => {
    const route = "testroute";
    const apiUrl = generateApiRoute(route);
    expect(apiUrl).to.equal(`/api/${route}`);
  });

  test("Middleware sets route and API version headers correctly", async () => {
    const apiVersion = "v2";

    const app = express();
    app.use(apiHeaderMiddleware(apiVersion));
    const res = await request(app).get("/");

    expect(res.headers).toEqual(expect.objectContaining({
      "x-route-api-version": apiVersion,
      "x-api-version": process.env.API_VERSION,
    }))
  });

  test("Middleware sets API version header correctly", async () => {
    const app = express();
    app.use(apiHeaderMiddleware());
    const res = await request(app).get("/");

    expect(res.headers).toEqual(expect.objectContaining({
      "x-api-version": process.env.API_VERSION,
    }));
  });
});

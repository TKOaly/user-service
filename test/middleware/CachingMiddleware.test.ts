import { describe, test, expect } from "vitest";
import express from "express";
import CachingMiddleware from "../../src/utils/CachingMiddleware";
import request from "supertest";

process.env.NODE_ENV = "test";

describe("CachingMiddleware", () => {
  test("Sets headers correctly", async () => {
    const app = express()

    app.use(CachingMiddleware);

    const res = await request(app).get("/");

    expect(res.headers).toMatchObject({
      'cache-control': 'private, no-cache, no-store, must-revalidate',
      'expires': '-1',
      'pragma': 'no-cache',
    });
  });
});

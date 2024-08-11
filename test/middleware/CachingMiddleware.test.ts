import { describe, test, expect } from "vitest";
import CachingMiddleware from "../../src/utils/CachingMiddleware";

process.env.NODE_ENV = "test";

const headers: Array<{ name: string; val: string }> = [];

let calledNext = false;
let nextCount = 0;

// Mocked express
// tslint:disable-next-line:typedef
const mockExpress = {
  req: {
    cookies: {},
    headers: {},
  },
  res: {
    header: (name: string, val: string): void => {
      headers.push({ name, val });
    },
  },
  next: (): void => {
    nextCount++;
    calledNext = true;
  },
};

describe("CachingMiddleware", () => {
  test("Sets headers correctly", () => {
    // @ts-ignore
    CachingMiddleware(mockExpress.req, mockExpress.res, mockExpress.next);

    expect(nextCount).to.equal(1);
    expect(calledNext).to.equal(true);
    expect(headers).toHaveLength(3);

    expect(headers).toEqual(expect.arrayContaining([
      {
        name: 'Cache-Control',
        val: "private, no-cache, no-store, must-revalidate",
      },
      {
        name: 'Expires',
        val: '-1',
      },
      {
        name: 'Pragma',
        val: 'no-cache'
      }
    ]))
  });
});

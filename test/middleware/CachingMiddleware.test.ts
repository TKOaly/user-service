process.env.NODE_ENV = "test";

import "mocha";
import CachingMiddleware from "../../src/utils/CachingMiddleware";

const headers: Array<{ name: string; val: string }> = [];

let calledNext: boolean = false;
let nextCount: number = 0;

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
  it("Sets headers correctly", (done: Mocha.Done) => {
    CachingMiddleware(mockExpress.req, mockExpress.res, mockExpress.next);
    nextCount.should.equal(1);
    calledNext.should.equal(true);
    headers.length.should.equal(3);
    const cacheHeader: any = headers[0];
    cacheHeader.name.should.equal("Cache-Control");
    cacheHeader.val.should.equal("private, no-cache, no-store, must-revalidate");
    const expiresHeader: any = headers[1];
    expiresHeader.name.should.equal("Expires");
    expiresHeader.val.should.equal("-1");
    const pragmaHeader: any = headers[2];
    pragmaHeader.name.should.equal("Pragma");
    pragmaHeader.val.should.equal("no-cache");
    done();
  });
});

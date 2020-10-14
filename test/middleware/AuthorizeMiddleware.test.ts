import "mocha";

process.env.NODE_ENV = "test";
// const chai: Chai.ChaiStatic = require("chai");
// const should = chai.should();
/*
import UserDao from "./../src/dao/UserDao";
import UserService from "./../src/services/UserService";

const headers: { name: string; val: string }[] = [];

let calledNext: boolean = false;
let returningStatus: { statusCode: number; data: any } = null;
let cookieToken: string = "";
let nextCount: number = 0;

// Mocked express
const mockExpress = {
  req: {
    cookies: {},
    headers: {}
  },
  res: {
    setHeader: (name: string, val: string): void => {
      headers.push({ name, val });
    },
    status: (statusCode: number): void => {
      json: data => {
        returningStatus = { statusCode, data };
      };
    }
  },
  next: (): void => {
    nextCount++;
    calledNext = true;
  }
};
*/
describe("AuthorizeMiddleware", () => {
  it("Example test", done => {
    done();
  });
});

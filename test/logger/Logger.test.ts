import { describe, test, expect } from "vitest";
import { redactUrl } from "../../src/logger";

describe("redactUrl()", () => {
  test("returns URLs without a query string unchanged", () => {
    expect(redactUrl("/api/users/me")).to.equal("/api/users/me");
    expect(redactUrl(undefined)).to.equal(undefined);
  });

  test("redacts password reset parameters", () => {
    const url = redactUrl("/reset-password?user=1&nonce=abc&expires=123&signature=def&hash=ghi");
    expect(url).to.equal("/reset-password?user=1&nonce=REDACTED&expires=123&signature=REDACTED&hash=REDACTED");
  });

  test("redacts OAuth parameters and keeps the rest", () => {
    const url = redactUrl("/oauth/authorize?client_id=foo&state=s3cr3t&code=xyz&redirect_uri=https%3A%2F%2Fa.b");
    expect(url).to.contain("client_id=foo");
    expect(url).to.contain("redirect_uri=https%3A%2F%2Fa.b");
    expect(url).to.contain("state=REDACTED");
    expect(url).to.contain("code=REDACTED");
    expect(url).not.to.contain("s3cr3t");
    expect(url).not.to.contain("xyz");
  });

  test("matches parameter names case-insensitively", () => {
    expect(redactUrl("/x?Password=hunter2")).to.equal("/x?Password=REDACTED");
  });
});

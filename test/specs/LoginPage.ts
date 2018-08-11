import * as assert from "assert";
import * as Wdio from "webdriverio";

describe("GitHub.com", function(): void {
  this.timeout(99999999);
  let client: Wdio.Client<any>;

  before(() => {
    client = Wdio.remote({
      desiredCapabilities: { browserName: "firefox", version: "60.0.1" }
    });
    return client.init();
  });

  it("Github test", async () => {
    return client
      .url("https://github.com/")
      .getTitle()
      .then((title: string) => {
        assert(
          title === "The world’s leading software development platform · GitHub"
        );
      });
  });

  after(() => {
    return client.end();
  });
});

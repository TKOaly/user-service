import * as assert from "assert";
import * as Wdio from "webdriverio";
import { IServiceDatabaseObject } from "../../src/models/Service";
import services = require("./../../seeds/seedData/services");
/*
import * as Knex from "knex";
import "mocha";
import { IKnexFile } from "../../knexfile";
// Knexfile
import * as knexfile from "../../knexfile";

// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);
*/
const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

describe("User service login page", function(): void {
  this.timeout(99999999);
  let client: Wdio.Client<void>;

  before(() => {
    client = Wdio.remote({
      desiredCapabilities: { browserName: "firefox", version: "60.0.1" }
    });
    return client.init();
  });

  it("Finnish login page is shown correctly", async () => {
    const filename: string =
      "screenshots/" + new Date().getTime() + "_finnish_login_page__test.png";
    return client
      .url(
        "http://localhost:3010?serviceIdentifier=" +
          serviceData[0].service_identifier
      )
      .refresh()
      .saveScreenshot(filename)
      .then((res: Buffer) => {
        console.log("Saved snapshot to " + filename);
      })
      .getTitle()
      .then((title: string) => {
        assert(
          title ===
            "Kirjaudu palveluun " +
              serviceData[0].display_name +
              " - TKO-äly ry"
        );
      })
      .getText("#title")
      .then((loginPageTitle: string) => {
        assert(loginPageTitle === "Kirjaudu palveluun");
      })
      .getText(".usernameLabel")
      .then((text: string) => {
        assert(text === "Käyttäjätunnus");
      })
      .getText(".passwordLabel")
      .then((text: string) => {
        assert(text === "Salasana");
      })
      .getAttribute("#username", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Käyttäjätunnus");
      })
      .getAttribute("#password", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Salasana");
      })
      .getValue(".input.accept")
      .then((text: string) => {
        assert(text === "Kirjaudu sisään");
      })
      .getText(".loginInEnglish")
      .then((text: string) => {
        assert(text === "In English");
      })
      .getText(".applyToBeAMember")
      .then((text: string) => {
        assert(text === "Liity TKO-älyn jäseneksi");
      });
  });

  it("English login page is shown correctly", async () => {
    const filename: string =
      "screenshots/" + new Date().getTime() + "_english_login_page_test.png";
    return client
      .url(
        "http://localhost:3010?serviceIdentifier=" +
          serviceData[0].service_identifier
      )
      .refresh()
      .click(".loginInEnglish")
      .saveScreenshot(filename)
      .then((res: Buffer) => {
        console.log("Saved snapshot to " + filename);
      })
      .getTitle()
      .then((title: string) => {
        assert(
          title === "Login to " + serviceData[0].display_name + " - TKO-äly ry"
        );
      })
      .getText("#title")
      .then((loginPageTitle: string) => {
        assert(loginPageTitle === "Login");
      })
      .getText(".usernameLabel")
      .then((text: string) => {
        assert(text === "Username");
      })
      .getAttribute("#username", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Username");
      })
      .getAttribute("#password", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Password");
      })
      .getText(".passwordLabel")
      .then((text: string) => {
        assert(text === "Password");
      })
      .getValue(".input.accept")
      .then((text: string) => {
        assert(text === "Login");
      })
      .getText(".loginInFinnish")
      .then((text: string) => {
        assert(text === "Suomeksi");
      })
      .getText(".applyToBeAMember")
      .then((text: string) => {
        assert(text === "Apply to be a member of TKO-äly");
      });
  });

  after(() => {
    return client.end();
  });
});

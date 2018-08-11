process.env.NODE_ENV = "test";

import * as assert from "assert";
import * as Knex from "knex";
import "mocha";
import * as Wdio from "webdriverio";
// Knexfile
import * as knexfile from "../../knexfile";
import { IServiceDatabaseObject } from "../../src/models/Service";
import { IKnexFile } from "./../../knexfile";
import services = require("./../../seeds/seedData/services");

// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);

const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

describe("User service login page", () => {
  let client: Wdio.Client<void>;

  beforeEach(() => {
    // The before hook ensures knex runs migrations and seeds the database every time
    return new Promise((resolve) =>
      knex.migrate.rollback().then(() => {
        knex.migrate.latest().then(() => {
          knex.seed.run().then(() => {
            client = Wdio.remote({
              desiredCapabilities: { browserName: "firefox", version: "60.0.1" }
            });
            resolve(client.init());
          });
        });
      })
    );
  });

  afterEach(() => {
    return new Promise((resolve) =>
      knex.migrate.rollback().then(() => {
        resolve(client.end());
      })
    );
  });

  it("Login page is shown correctly (Finnish)", () => {
    const filename: string = "screenshots/finnish_login_page_test.png";
    return client
      .url("http://localhost:3010/lang/fi/" + serviceData[0].service_identifier)
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

  it("Login page is shown correctly (English)", () => {
    const filename: string = "screenshots/english_login_page_test.png";
    return client
      .url("http://localhost:3010/lang/en/" + serviceData[0].service_identifier)
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

  it("On invalid username or password, shows correct error message (Finnish)", () => {
    const filename: string = "screenshots/finnish_login_error_message_test.png";
    return client
      .url("http://localhost:3010/lang/fi/" + serviceData[0].service_identifier)
      .setValue("#username", "test_user")
      .setValue("#password", "wrong_password")
      .click(".accept")
      .saveScreenshot(filename)
      .getText(".error-text")
      .then((msg: string) => {
        assert(msg === "Invalid username or password");
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
      })
      .getTitle()
      .then((title: string) => {
        assert(
          title ===
            "Kirjaudu palveluun " +
              serviceData[0].display_name +
              " - TKO-äly ry"
        );
      });
  });

  it("On invalid username or password, shows correct error message (English)", async () => {
    const filename: string = "screenshots/english_login_error_message_test.png";
    return client
      .url("http://localhost:3010/lang/en/" + serviceData[0].service_identifier)
      .setValue("#username", "test_user")
      .setValue("#password", "wrong_password")
      .click(".accept")
      .saveScreenshot(filename)
      .getText(".error-text")
      .then((msg: string) => {
        assert(msg === "Invalid username or password");
      })
      .getText("#title")
      .then((loginPageTitle: string) => {
        assert(loginPageTitle === "Login");
      })
      .getText(".usernameLabel")
      .then((text: string) => {
        assert(text === "Username");
      })
      .getText(".passwordLabel")
      .then((text: string) => {
        assert(text === "Password");
      })
      .getAttribute("#username", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Username");
      })
      .getAttribute("#password", "placeholder")
      .then((attrib: string) => {
        assert(attrib === "Password");
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
      })
      .getTitle()
      .then((title: string) => {
        assert(
          title === "Login to " + serviceData[0].display_name + " - TKO-äly ry"
        );
      });
  });
}).timeout(5000);

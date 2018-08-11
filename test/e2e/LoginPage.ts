process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
// Knexfile
import * as knexfile from "../../knexfile";
import { IServiceDatabaseObject } from "../../src/models/Service";
import { IKnexFile } from "./../../knexfile";
import services = require("./../../seeds/seedData/services");

// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);

const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

describe("User service login page", () => {
  beforeEach(() => {
    // The before hook ensures, that knex runs database migrations and seeds.
    return new Promise((resolve) =>
      knex.migrate.rollback().then(() => {
        knex.migrate.latest().then(() => {
          knex.seed.run().then(() => {
            // Reload the browser
            resolve(browser.reload());
          });
        });
      })
    );
  });

  afterEach(() => {
    return new Promise((resolve) =>
      knex.migrate.rollback().then(() => {
        resolve(true);
      })
    );
  });

  it("Login page is shown correctly (Finnish)", () => {
    const filename: string = "screenshots/finnish_login_page_test.png";
    browser.url(
      "http://localhost:3010/lang/fi/" + serviceData[0].service_identifier
    );
    browser.saveScreenshot(filename);
    console.log("Saved snapshot to " + filename);
    browser
      .getTitle()
      .should.equal(
        "Kirjaudu palveluun " + serviceData[0].display_name + " - TKO-äly ry"
      );
    browser.getText("#title").should.equal("Kirjaudu palveluun");
    browser.getText(".usernameLabel").should.equal("Käyttäjätunnus");
    browser.getText(".passwordLabel").should.equal("Salasana");
    browser
      .getAttribute("#username", "placeholder")
      .should.equal("Käyttäjätunnus");
    browser.getAttribute("#password", "placeholder").should.equal("Salasana");
    browser.getValue(".input.accept").should.equal("Kirjaudu sisään");
    browser.getText(".loginInEnglish").should.equal("In English");
    browser
      .getText(".applyToBeAMember")
      .should.equal("Liity TKO-älyn jäseneksi");
  });

  it("Login page is shown correctly (English)", () => {
    const filename: string = "screenshots/english_login_page_test.png";
    browser.url(
      "http://localhost:3010/lang/en/" + serviceData[0].service_identifier
    );
    browser.saveScreenshot(filename);
    console.log("Saved snapshot to " + filename);
    browser
      .getTitle()
      .should.equal(
        "Login to " + serviceData[0].display_name + " - TKO-äly ry"
      );
    browser.getText("#title").should.equal("Login");
    browser.getText(".usernameLabel").should.equal("Username");
    browser.getText(".passwordLabel").should.equal("Password");
    browser.getAttribute("#username", "placeholder").should.equal("Username");
    browser.getAttribute("#password", "placeholder").should.equal("Password");
    browser.getValue(".input.accept").should.equal("Login");
    browser.getText(".loginInFinnish").should.equal("Suomeksi");
    browser
      .getText(".applyToBeAMember")
      .should.equal("Apply to be a member of TKO-äly");
  });

  it("On invalid username or password, shows correct error message (Finnish)", () => {
    const filename: string = "screenshots/finnish_login_error_message_test.png";
    browser.url(
      "http://localhost:3010/lang/fi/" + serviceData[0].service_identifier
    );
    browser.setValue("#username", "test_user");
    browser.setValue("#password", "wrong_password");
    browser.click(".accept");
    browser.saveScreenshot(filename);

    console.log("Saved snapshot to " + filename);

    browser.getText(".error-text").should.equal("Invalid username or password");

    browser.getText("#title").should.equal("Kirjaudu palveluun");
    browser.getText(".usernameLabel").should.equal("Käyttäjätunnus");

    browser.getText(".passwordLabel").should.equal("Salasana");
    browser
      .getAttribute("#username", "placeholder")
      .should.equal("Käyttäjätunnus");
    browser.getAttribute("#password", "placeholder").should.equal("Salasana");
    browser.getValue(".input.accept").should.equal("Kirjaudu sisään");
    browser.getText(".loginInEnglish").should.equal("In English");
    browser
      .getText(".applyToBeAMember")
      .should.equal("Liity TKO-älyn jäseneksi");
    browser
      .getTitle()
      .should.equal(
        "Kirjaudu palveluun " + serviceData[0].display_name + " - TKO-äly ry"
      );
  });

  it("On invalid username or password, shows correct error message (English)", async () => {
    const filename: string = "screenshots/english_login_error_message_test.png";
    browser.url(
      "http://localhost:3010/lang/en/" + serviceData[0].service_identifier
    );
    browser.setValue("#username", "test_user");
    browser.setValue("#password", "wrong_password");
    browser.click(".accept");
    browser.saveScreenshot(filename);

    console.log("Saved snapshot to " + filename);

    browser.getText(".error-text").should.equal("Invalid username or password");

    browser.getText("#title").should.equal("Login");
    browser.getText(".usernameLabel").should.equal("Username");

    browser.getText(".passwordLabel").should.equal("Password");
    browser.getAttribute("#username", "placeholder").should.equal("Username");
    browser.getAttribute("#password", "placeholder").should.equal("Password");
    browser.getValue(".input.accept").should.equal("Login");
    browser.getText(".loginInFinnish").should.equal("Suomeksi");
    browser
      .getText(".applyToBeAMember")
      .should.equal("Apply to be a member of TKO-äly");
    browser
      .getTitle()
      .should.equal(
        "Login to " + serviceData[0].display_name + " - TKO-äly ry"
      );
  });
}).timeout(5000);

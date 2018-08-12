process.env.NODE_ENV = "test";

import * as Knex from "knex";
import "mocha";
// Knexfile
import * as knexfile from "../../knexfile";
import { IServiceDatabaseObject } from "../../src/models/Service";
import { IKnexFile } from "./../../knexfile";
const en: any = require("./../../locales/en.json");
const fi: any = require("./../../locales/fi.json");
import services = require("./../../seeds/seedData/services");

// Knex instance
const knex: Knex = Knex((knexfile as IKnexFile).test);

const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

describe("User service: Login page", () => {
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
        fi.login_Login_to + " " + serviceData[0].display_name + " - TKO-äly ry"
      );
    browser.getText("#title").should.equal(fi.login_Login);
    browser.getText(".usernameLabel").should.equal(fi.login_UsernameLabel);
    browser.getText(".passwordLabel").should.equal(fi.login_PasswordLabel);
    browser
      .getAttribute("#username", "placeholder")
      .should.equal(fi.login_UsernamePlaceholder);
    browser.getAttribute("#password", "placeholder").should.equal(fi.login_PasswordPlaceholder);
    browser.getValue(".input.accept").should.equal(fi.login_LoginButton);
    browser.getText(".loginInEnglish").should.equal(fi.login_InEnglish);
    browser
      .getText(".applyToBeAMember")
      .should.equal(fi.login_RegisterToServiceText);
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
        en.login_Login_to + " " + serviceData[0].display_name + " - TKO-äly ry"
      );
    browser.getText("#title").should.equal(en.login_Login);
    browser.getText(".usernameLabel").should.equal(en.login_UsernameLabel);
    browser.getText(".passwordLabel").should.equal(en.login_PasswordLabel);
    browser
      .getAttribute("#username", "placeholder")
      .should.equal(en.login_UsernamePlaceholder);
    browser.getAttribute("#password", "placeholder").should.equal(en.login_PasswordPlaceholder);
    browser.getValue(".input.accept").should.equal(en.login_LoginButton);
    browser.getText(".loginInFinnish").should.equal(en.login_InFinnish);
    browser
      .getText(".applyToBeAMember")
      .should.equal(en.login_RegisterToServiceText);
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

    browser.getText("#title").should.equal(fi.login_Login);
    browser.getText(".usernameLabel").should.equal(fi.login_UsernameLabel);

    browser.getText(".passwordLabel").should.equal(fi.login_PasswordLabel);
    browser
      .getAttribute("#username", "placeholder")
      .should.equal(fi.login_UsernamePlaceholder);
    browser.getAttribute("#password", "placeholder").should.equal(fi.login_PasswordPlaceholder);
    browser.getValue(".input.accept").should.equal(fi.login_LoginButton);
    browser.getText(".loginInEnglish").should.equal(fi.login_InEnglish);
    browser
      .getText(".applyToBeAMember")
      .should.equal(fi.login_RegisterToServiceText);
    browser
      .getTitle()
      .should.equal(
        fi.login_Login_to + " " + serviceData[0].display_name + " - TKO-äly ry"
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

    browser.getText("#title").should.equal(en.login_Login);
    browser.getText(".usernameLabel").should.equal(en.login_UsernameLabel);

    browser.getText(".passwordLabel").should.equal(en.login_PasswordLabel);
    browser
      .getAttribute("#username", "placeholder")
      .should.equal(en.login_UsernamePlaceholder);
    browser.getAttribute("#password", "placeholder").should.equal(en.login_PasswordPlaceholder);
    browser.getValue(".input.accept").should.equal(en.login_LoginButton);
    browser.getText(".loginInFinnish").should.equal(en.login_InFinnish);
    browser
      .getText(".applyToBeAMember")
      .should.equal(en.login_RegisterToServiceText);
    browser
      .getTitle()
      .should.equal(
        en.login_Login_to + " " + serviceData[0].display_name + " - TKO-äly ry"
      );
  });
}).timeout(5000);

describe("User service: Privacy policy page", () => {
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

  it("On successful login, privacy policy page is shown for new users (Finnish)", () => {
    const filename: string = "screenshots/finnish_privacy_policy_page_test.png";
    browser.url(
      "http://localhost:3010/lang/fi/" + serviceData[0].service_identifier
    );
    browser.setValue("#username", "test_user");
    browser.setValue("#password", "test_user");
    browser.click(".accept");
    browser.saveScreenshot(filename);

    console.log("Saved snapshot to " + filename);

    browser
      .getText("#title")
      .should.equal(
        serviceData[0].display_name + " -palvelun tietosuojaseloste"
      );
    browser
      .getTitle()
      .should.equal(
        serviceData[0].display_name +
          " -palvelun tietosuojaseloste - TKO-äly ry"
      );
    browser.getValue(".cancel").should.equal("Hylkää");
    browser.getValue(".accept").should.equal("Hyväksy");
    browser
      .getText(".privacyPolicyRedirect")
      .should.equal(
        "Sinut uudelleenohjataan hyväksymisen jälkeen palvelun etusivulle."
      );
    browser
      .getText(".privacyPolicyDeclineMessage")
      .should.equal(
        "Jos hylkäät " +
          serviceData[0].display_name +
          "-palvelun tietosuojaselosteen mukaisen henkilötietojen käyttämisen, et voi käyttää palvelua." +
          " Voit kuitenkin palata hyväksymään henkilötietojen käyttämisen myöhemmin."
      );
  });
}).timeout(5000);

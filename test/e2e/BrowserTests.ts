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

  for (const service of serviceData) {
    it(
      "Login page is shown correctly (Finnish) - " + service.display_name,
      () => {
        const filename: string =
          "screenshots/finnish_login_page_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/fi/" + service.service_identifier
        );
        browser.saveScreenshot(filename);
        console.log("Saved snapshot to " + filename);
        browser
          .getTitle()
          .should.equal(
            fi.login_Login_to + " " + service.display_name + " - TKO-äly ry"
          );
        browser.getText("#title").should.equal(fi.login_Login);
        browser.getText(".usernameLabel").should.equal(fi.login_UsernameLabel);
        browser.getText(".passwordLabel").should.equal(fi.login_PasswordLabel);
        browser
          .getAttribute("#username", "placeholder")
          .should.equal(fi.login_UsernamePlaceholder);
        browser
          .getAttribute("#password", "placeholder")
          .should.equal(fi.login_PasswordPlaceholder);
        browser.getValue(".input.accept").should.equal(fi.login_LoginButton);
        browser.getText(".loginInEnglish").should.equal(fi.login_InEnglish);
        browser
          .getText(".applyToBeAMember")
          .should.equal(fi.login_RegisterToServiceText);
      }
    );
  }

  for (const service of serviceData) {
    it(
      "Login page is shown correctly (English) - " + service.display_name,
      () => {
        const filename: string =
          "screenshots/english_login_page_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/en/" + service.service_identifier
        );
        browser.saveScreenshot(filename);
        console.log("Saved snapshot to " + filename);
        browser
          .getTitle()
          .should.equal(
            en.login_Login_to + " " + service.display_name + " - TKO-äly ry"
          );
        browser.getText("#title").should.equal(en.login_Login);
        browser.getText(".usernameLabel").should.equal(en.login_UsernameLabel);
        browser.getText(".passwordLabel").should.equal(en.login_PasswordLabel);
        browser
          .getAttribute("#username", "placeholder")
          .should.equal(en.login_UsernamePlaceholder);
        browser
          .getAttribute("#password", "placeholder")
          .should.equal(en.login_PasswordPlaceholder);
        browser.getValue(".input.accept").should.equal(en.login_LoginButton);
        browser.getText(".loginInFinnish").should.equal(en.login_InFinnish);
        browser
          .getText(".applyToBeAMember")
          .should.equal(en.login_RegisterToServiceText);
      }
    );
  }

  for (const service of serviceData) {
    it(
      "On invalid username or password, shows correct error message (Finnish) - " +
        service.display_name,
      () => {
        const filename: string =
          "screenshots/finnish_login_error_message_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/fi/" + service.service_identifier
        );
        browser.setValue("#username", "test_user");
        browser.setValue("#password", "wrong_password");
        browser.click(".accept");
        browser.saveScreenshot(filename);

        console.log("Saved snapshot to " + filename);

        browser
          .getText(".error-text")
          .should.equal("Invalid username or password");

        browser.getText("#title").should.equal(fi.login_Login);
        browser.getText(".usernameLabel").should.equal(fi.login_UsernameLabel);

        browser.getText(".passwordLabel").should.equal(fi.login_PasswordLabel);
        browser
          .getAttribute("#username", "placeholder")
          .should.equal(fi.login_UsernamePlaceholder);
        browser
          .getAttribute("#password", "placeholder")
          .should.equal(fi.login_PasswordPlaceholder);
        browser.getValue(".input.accept").should.equal(fi.login_LoginButton);
        browser.getText(".loginInEnglish").should.equal(fi.login_InEnglish);
        browser
          .getText(".applyToBeAMember")
          .should.equal(fi.login_RegisterToServiceText);
        browser
          .getTitle()
          .should.equal(
            fi.login_Login_to + " " + service.display_name + " - TKO-äly ry"
          );
      }
    );
  }

  for (const service of serviceData) {
    it(
      "On invalid username or password, shows correct error message (English) - " +
        service.display_name,
      async () => {
        const filename: string =
          "screenshots/english_login_error_message_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/en/" + service.service_identifier
        );
        browser.setValue("#username", "test_user");
        browser.setValue("#password", "wrong_password");
        browser.click(".accept");
        browser.saveScreenshot(filename);

        console.log("Saved snapshot to " + filename);

        browser
          .getText(".error-text")
          .should.equal("Invalid username or password");

        browser.getText("#title").should.equal(en.login_Login);
        browser.getText(".usernameLabel").should.equal(en.login_UsernameLabel);

        browser.getText(".passwordLabel").should.equal(en.login_PasswordLabel);
        browser
          .getAttribute("#username", "placeholder")
          .should.equal(en.login_UsernamePlaceholder);
        browser
          .getAttribute("#password", "placeholder")
          .should.equal(en.login_PasswordPlaceholder);
        browser.getValue(".input.accept").should.equal(en.login_LoginButton);
        browser.getText(".loginInFinnish").should.equal(en.login_InFinnish);
        browser
          .getText(".applyToBeAMember")
          .should.equal(en.login_RegisterToServiceText);
        browser
          .getTitle()
          .should.equal(
            en.login_Login_to + " " + service.display_name + " - TKO-äly ry"
          );
      }
    );
  }
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

  for (const service of serviceData) {
    it(
      "On successful login, privacy policy page is shown for new users (Finnish) - " +
        service.display_name,
      () => {
        const filename: string =
          "screenshots/finnish_privacy_policy_page_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/fi/" + service.service_identifier
        );
        browser.setValue("#username", "admin_user");
        browser.setValue("#password", "admin_user");
        browser.click(".accept");
        browser.saveScreenshot(filename);

        console.log("Saved snapshot to " + filename);

        browser
          .getText("#title")
          .should.equal(service.display_name + " " + fi.privacypolicy_Title);
        browser
          .getTitle()
          .should.equal(
            service.display_name +
              " " +
              fi.privacypolicy_Title +
              " - TKO-äly ry"
          );
        browser.getValue(".cancel").should.equal(fi.privacypolicy_Decline);
        browser.getValue(".accept").should.equal(fi.privacypolicy_Accept);
        browser
          .getText(".privacyPolicyRedirect")
          .should.equal(fi.privacypolicy_YouWillBeRedirected);
        browser
          .getText(".privacyPolicyDeclineMessage")
          .should.equal(
            fi.privacypolicy_IfYouDecline_1 +
              " " +
              service.display_name +
              fi.privacypolicy_IfYouDecline_2
          );
      }
    );
  }

  for (const service of serviceData) {
    it(
      "On successful login, privacy policy page is shown for new users (English) - " +
        service.display_name,
      () => {
        const filename: string =
          "screenshots/english_privacy_policy_page_test_" +
          service.service_name +
          ".png";
        browser.url(
          "http://localhost:3010/lang/en/" + service.service_identifier
        );
        browser.setValue("#username", "admin_user");
        browser.setValue("#password", "admin_user");
        browser.click(".accept");
        browser.saveScreenshot(filename);

        console.log("Saved snapshot to " + filename);

        browser
          .getText("#title")
          .should.equal(service.display_name + en.privacypolicy_Title);
        browser
          .getTitle()
          .should.equal(
            service.display_name + en.privacypolicy_Title + " - TKO-äly ry"
          );
        browser.getValue(".cancel").should.equal(en.privacypolicy_Decline);
        browser.getValue(".accept").should.equal(en.privacypolicy_Accept);
        browser
          .getText(".privacyPolicyRedirect")
          .should.equal(en.privacypolicy_YouWillBeRedirected);
        browser
          .getText(".privacyPolicyDeclineMessage")
          .should.equal(
            en.privacypolicy_IfYouDecline_1 +
              service.display_name +
              en.privacypolicy_IfYouDecline_2
          );
      }
    );
  }
}).timeout(5000);

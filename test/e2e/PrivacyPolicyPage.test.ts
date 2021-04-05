import { By, WebDriver } from "selenium-webdriver";
import { cleanupDriver, prepareDriver } from "../WebDriver";

import "mocha";
import { knexInstance } from "../../src/Db";

import { ServiceDatabaseObject } from "../../src/models/Service";

import { Server } from "http";
import app from "../../src/App";

import en from "../../locales/en.json";
import fi from "../../locales/fi.json";

process.env.NODE_ENV = "test";
import services = require("../../seeds/seedData/services");

// Knex instance
const knex = knexInstance;

const serviceData = services as ServiceDatabaseObject[];

const port = 3010;

describe("Privacy policy page", () => {
  let browser: WebDriver;
  let express: Server;

  before(done => {
    prepareDriver().then(driver => {
      browser = driver;
      express = app.listen(port, () => {
        done();
      });
    });
  });

  after(done => {
    cleanupDriver(browser).then(() => {
      express.close(() => {
        done();
      });
    });
  });

  beforeEach(done => {
    // The before hook ensures, that knex runs database migrations and seeds.
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  afterEach(done => {
    knex.migrate.rollback().then(() => {
      done();
    });
  });

  for (const service of serviceData) {
    it(
      "On successful login, privacy policy page is shown for new users (Finnish) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);
        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + " " + fi.privacypolicy_Title);

        const title = await browser.getTitle();
        title.should.equal(service.display_name + " " + fi.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(fi.privacypolicy_Decline);

        const acceptVal = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(fi.privacypolicy_Accept);

        const privacyPolicyRedirect = await browser.findElement(By.className("privacyPolicyRedirect")).getText();
        privacyPolicyRedirect.should.equal(fi.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined = await browser.findElement(By.className("privacyPolicyDeclineMessage")).getText();
        privacyPolicyDeclined.should.equal(
          fi.privacypolicy_IfYouDecline_1 + " " + service.display_name + fi.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }

  for (const service of serviceData) {
    it(
      "On successful login, privacy policy page is shown for new users (English) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);
        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + en.privacypolicy_Title);

        const title = await browser.getTitle();
        title.should.equal(service.display_name + en.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(en.privacypolicy_Decline);

        const acceptVal = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(en.privacypolicy_Accept);

        const privacyPolicyRedirect = await browser.findElement(By.className("privacyPolicyRedirect")).getText();
        privacyPolicyRedirect.should.equal(en.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined = await browser.findElement(By.className("privacyPolicyDeclineMessage")).getText();
        privacyPolicyDeclined.should.equal(
          en.privacypolicy_IfYouDecline_1 + service.display_name + en.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }
}).timeout(5000);

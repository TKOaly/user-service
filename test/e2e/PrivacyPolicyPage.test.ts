import { describe, test, beforeEach, beforeAll, afterEach, afterAll, expect } from "vitest";
import { By, WebDriver } from "selenium-webdriver";
import { cleanupDriver, prepareDriver } from "../WebDriver";

import { knexInstance as knex } from "../../src/Db";

import { ServiceDatabaseObject } from "../../src/models/Service";

import { Server } from "http";
import app from "../../src/App";

import en from "../../locales/en.json";
import fi from "../../locales/fi.json";
import services from "../../seeds/seedData/services";
import UserService from "../../src/services/UserService";

process.env.NODE_ENV = "test";

const serviceData = services as ServiceDatabaseObject[];

const port = 3010;

describe("Privacy policy page", () => {
  let browser: WebDriver;
  let express: Server;

  beforeAll(async () => {
    browser = await prepareDriver();

    await new Promise<void>(resolve => {
      express = app.listen(port, () => resolve());
    });
  }, 30000);

  afterAll(async () => {
    await cleanupDriver(browser);
    await new Promise<void>(resolve => (express ? express.close(() => resolve()) : resolve()));
  });

  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await UserService.stop();
    await knex.migrate.rollback();
  });

  for (const service of serviceData) {
    test(
      "On successful login, privacy policy page is shown for new users (Finnish) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);
        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle = await browser.findElement(By.id("title")).getText();
        expect(containerTitle).to.equal(service.display_name + " " + fi.privacypolicy_Title);

        const title = await browser.getTitle();
        expect(title).to.equal(fi.privacypolicy_title + " - TKO-äly ry");

        const cancelVal = await browser.findElement(By.className("cancel")).getAttribute("value");
        expect(cancelVal).to.equal(fi.privacypolicy_Decline);

        const acceptVal = await browser.findElement(By.className("accept")).getAttribute("value");
        expect(acceptVal).to.equal(fi.privacypolicy_Accept);

        const privacyPolicyRedirect = await browser.findElement(By.className("privacyPolicyRedirect")).getText();
        expect(privacyPolicyRedirect).to.equal(fi.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined = await browser.findElement(By.className("privacyPolicyDeclineMessage")).getText();
        expect(privacyPolicyDeclined).to.equal(
          fi.privacypolicy_IfYouDecline_1 + " " + service.display_name + fi.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }

  for (const service of serviceData) {
    test(
      "On successful login, privacy policy page is shown for new users (English) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);
        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle = await browser.findElement(By.id("title")).getText();
        expect(containerTitle).to.equal(service.display_name + en.privacypolicy_Title);

        const title = await browser.getTitle();
        expect(title).to.equal(en.privacypolicy_title + " - TKO-äly ry");

        const cancelVal = await browser.findElement(By.className("cancel")).getAttribute("value");
        expect(cancelVal).to.equal(en.privacypolicy_Decline);

        const acceptVal = await browser.findElement(By.className("accept")).getAttribute("value");
        expect(acceptVal).to.equal(en.privacypolicy_Accept);

        const privacyPolicyRedirect = await browser.findElement(By.className("privacyPolicyRedirect")).getText();
        expect(privacyPolicyRedirect).to.equal(en.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined = await browser.findElement(By.className("privacyPolicyDeclineMessage")).getText();
        expect(privacyPolicyDeclined).to.equal(
          en.privacypolicy_IfYouDecline_1 + service.display_name + en.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }
});

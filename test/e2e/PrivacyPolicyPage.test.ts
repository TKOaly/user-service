process.env.NODE_ENV = "test";

import { By } from "selenium-webdriver";
import { cleanupDriver, prepareDriver } from "../WebDriver";

import chai = require("chai");
import Knex from "knex";
import "mocha";

// Knexfile
import * as knexfile from "../../knexfile";
import { IServiceDatabaseObject } from "../../src/models/Service";

import { WebDriver } from "selenium-webdriver";
import services = require("../../seeds/seedData/services");

import { Server } from "http";
import app from "../../src/App";
import UserDao from "../../src/dao/UserDao";
import User from "../../src/models/User";
import UserService from "../../src/services/UserService";

// @ts-ignore
const should: Chai.Should = chai.should();

// Knex instance
const knex: Knex = Knex(knexfile.test);

const userService: UserService = new UserService(new UserDao(knex));

const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

const en: any = require("./../../locales/en.json");
const fi: any = require("./../../locales/fi.json");

const port: number = 3010;

describe("Privacy policy page", () => {
  let browser: WebDriver;
  let express: Server;

  before((done: Mocha.Done) => {
    prepareDriver().then((driver: WebDriver) => {
      browser = driver;
      express = app.listen(port, () => {
        done();
      });
    });
  });

  after((done: Mocha.Done) => {
    cleanupDriver(browser).then(() => {
      express.close(() => {
        done();
      });
    });
  });

  beforeEach((done: Mocha.Done) => {
    // The before hook ensures, that knex runs database migrations and seeds.
    knex.migrate.rollback().then(() => {
      knex.migrate.latest().then(() => {
        knex.seed.run().then(() => {
          done();
        });
      });
    });
  });

  afterEach((done: Mocha.Done) => {
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

        const containerTitle: string = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + " " + fi.privacypolicy_Title);

        const title: string = await browser.getTitle();
        title.should.equal(service.display_name + " " + fi.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal: string = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(fi.privacypolicy_Decline);

        const acceptVal: string = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(fi.privacypolicy_Accept);

        const privacyPolicyRedirect: string = await browser
          .findElement(By.className("privacyPolicyRedirect"))
          .getText();
        privacyPolicyRedirect.should.equal(fi.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined: string = await browser
          .findElement(By.className("privacyPolicyDeclineMessage"))
          .getText();
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

        const containerTitle: string = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + en.privacypolicy_Title);

        const title: string = await browser.getTitle();
        title.should.equal(service.display_name + en.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal: string = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(en.privacypolicy_Decline);

        const acceptVal: string = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(en.privacypolicy_Accept);

        const privacyPolicyRedirect: string = await browser
          .findElement(By.className("privacyPolicyRedirect"))
          .getText();
        privacyPolicyRedirect.should.equal(en.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined: string = await browser
          .findElement(By.className("privacyPolicyDeclineMessage"))
          .getText();
        privacyPolicyDeclined.should.equal(
          en.privacypolicy_IfYouDecline_1 + service.display_name + en.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }

  for (const service of serviceData) {
    it(
      "On successful login, user salt should be rehashed with bcrypt (Finnish) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);

        const userBefore: User = await userService.fetchUser(2);
        should.exist(userBefore.salt);
        userBefore.salt.should.not.equal("0");

        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const userAfter: User = await userService.fetchUser(2);
        should.exist(userAfter.salt);
        userBefore.salt.should.not.equal(userAfter.salt);
        userAfter.salt.should.equal("0");

        // Relogin to verify that login works with newly hashed password
        await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);

        // Recheck salt
        const userAfter2: User = await userService.fetchUser(2);
        should.exist(userAfter2.salt);
        userAfter2.salt.should.equal("0");

        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle: string = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + " " + fi.privacypolicy_Title);

        const title: string = await browser.getTitle();
        title.should.equal(service.display_name + " " + fi.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal: string = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(fi.privacypolicy_Decline);

        const acceptVal: string = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(fi.privacypolicy_Accept);

        const privacyPolicyRedirect: string = await browser
          .findElement(By.className("privacyPolicyRedirect"))
          .getText();
        privacyPolicyRedirect.should.equal(fi.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined: string = await browser
          .findElement(By.className("privacyPolicyDeclineMessage"))
          .getText();
        privacyPolicyDeclined.should.equal(
          fi.privacypolicy_IfYouDecline_1 + " " + service.display_name + fi.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }

  for (const service of serviceData) {
    it(
      "On successful login, user salt should be rehashed with bcrypt (English) - " + service.display_name,
      async () => {
        await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

        const userBefore: User = await userService.fetchUser(2);
        should.exist(userBefore.salt);
        userBefore.salt.should.not.equal("0");

        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const userAfter: User = await userService.fetchUser(2);
        should.exist(userAfter.salt);
        userBefore.salt.should.not.equal(userAfter.salt);
        userAfter.salt.should.equal("0");

        // Relogin to verify that login works with newly hashed password
        await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

        // Recheck salt
        const userAfter2: User = await userService.fetchUser(2);
        should.exist(userAfter2.salt);
        userAfter2.salt.should.equal("0");

        await browser.findElement(By.id("username")).sendKeys("admin_user");
        await browser.findElement(By.id("password")).sendKeys("admin_user");
        await browser.findElement(By.className("accept")).click();

        const containerTitle: string = await browser.findElement(By.id("title")).getText();
        containerTitle.should.equal(service.display_name + en.privacypolicy_Title);

        const title: string = await browser.getTitle();
        title.should.equal(service.display_name + en.privacypolicy_Title + " - TKO-äly ry");

        const cancelVal: string = await browser.findElement(By.className("cancel")).getAttribute("value");
        cancelVal.should.equal(en.privacypolicy_Decline);

        const acceptVal: string = await browser.findElement(By.className("accept")).getAttribute("value");
        acceptVal.should.equal(en.privacypolicy_Accept);

        const privacyPolicyRedirect: string = await browser
          .findElement(By.className("privacyPolicyRedirect"))
          .getText();
        privacyPolicyRedirect.should.equal(en.privacypolicy_YouWillBeRedirected);

        const privacyPolicyDeclined: string = await browser
          .findElement(By.className("privacyPolicyDeclineMessage"))
          .getText();
        privacyPolicyDeclined.should.equal(
          en.privacypolicy_IfYouDecline_1 + service.display_name + en.privacypolicy_IfYouDecline_2,
        );
      },
    );
  }
}).timeout(5000);

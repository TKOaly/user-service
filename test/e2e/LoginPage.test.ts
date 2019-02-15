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

// @ts-ignore
const should: Chai.Should = chai.should();

// Knex instance
const knex: Knex = Knex(knexfile.test);

const serviceData: IServiceDatabaseObject[] = services as IServiceDatabaseObject[];

import en from "../../locales/en.json";
import fi from "../../locales/fi.json";

const port: number = 3010;

describe("Login page", () => {
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

  it("Missing service identifier should show the correct error page (Finnish)", async () => {
    await browser.get("http://localhost:3010/lang/fi/");

    const title: string = await browser.getTitle();

    title.should.equal(fi.error_Title + " - TKO-äly ry");
    const contentTitle: string = await browser.findElement(By.id("title")).getText();

    contentTitle.should.equal(fi.error_Title);

    const errorText: string = await browser.findElement(By.className("error-text")).getText();

    errorText.should.equal("Missing service identifier");
  });

  it("Missing service identifier should show the correct error page (English)", async () => {
    await browser.get("http://localhost:3010/lang/en/");

    const title: string = await browser.getTitle();

    title.should.equal(en.error_Title + " - TKO-äly ry");
    const contentTitle: string = await browser.findElement(By.id("title")).getText();

    contentTitle.should.equal(en.error_Title);

    const errorText: string = await browser.findElement(By.className("error-text")).getText();

    errorText.should.equal("Missing service identifier");
  });

  for (const service of serviceData) {
    it("Login page is shown correctly (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);

      const title: string = await browser.getTitle();

      title.should.equal(fi.login_Login_to + " " + service.display_name + " - TKO-äly ry");
      const contentTitle: string = await browser.findElement(By.id("title")).getText();

      contentTitle.should.equal(fi.login_Login);

      const usernameLabel: string = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(fi.login_UsernameLabel);

      const passwordLabel: string = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(fi.login_PasswordLabel);

      const usernamePlaceholder: string = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder: string = await browser.findElement(By.id("password")).getAttribute("placeholder");

      passwordPlaceholder.should.equal(fi.login_PasswordPlaceholder);

      const acceptInput: string = await browser.findElement(By.className("input accept")).getAttribute("value");
      acceptInput.should.equal(fi.login_LoginButton);

      const loginInEnglish: string = await browser.findElement(By.className("loginInEnglish")).getText();
      loginInEnglish.should.equal(fi.login_InEnglish);

      const applyToBeAMember: string = await browser.findElement(By.className("applyToBeAMember")).getText();
      applyToBeAMember.should.equal(fi.login_RegisterToServiceText);

      const csrf: string = await browser.findElement(By.name("_csrf")).getAttribute("value");
      csrf.should.not.equal("");
    });
  }

  for (const service of serviceData) {
    it("Login page is shown correctly (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      const title: string = await browser.getTitle();
      title.should.equal(en.login_Login_to + " " + service.display_name + " - TKO-äly ry");
      const containerTitle: string = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(en.login_Login);

      const usernameLabel: string = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(en.login_UsernameLabel);

      const passwordLabel: string = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(en.login_PasswordLabel);

      const usernamePlaceholder: string = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder: string = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(en.login_PasswordPlaceholder);

      const accept: string = await browser.findElement(By.className("accept")).getAttribute("value");
      accept.should.equal(en.login_LoginButton);

      const loginInFinnish: string = await browser.findElement(By.className("loginInFinnish")).getText();
      loginInFinnish.should.equal(en.login_InFinnish);

      const applyToBeAMember: string = await browser.findElement(By.className("applyToBeAMember")).getText();
      applyToBeAMember.should.equal(en.login_RegisterToServiceText);

      const csrf: string = await browser.findElement(By.name("_csrf")).getAttribute("value");
      csrf.should.not.equal("");
    });
  }

  for (const service of serviceData) {
    it("On invalid username or password, shows correct error message (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);
      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText: string = await browser.findElement(By.className("error-text")).getText();
      errorText.should.equal("Invalid username or password");

      const containerTitle: string = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(fi.login_Login);

      const usernameLabel: string = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(fi.login_UsernameLabel);

      const passwordLabel: string = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(fi.login_PasswordLabel);

      const usernamePlaceholder: string = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder: string = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(fi.login_PasswordPlaceholder);

      const acceptValue: string = await browser.findElement(By.className("accept")).getAttribute("value");
      acceptValue.should.equal(fi.login_LoginButton);

      const loginInEnglish: string = await browser.findElement(By.className("loginInEnglish")).getText();
      loginInEnglish.should.equal(fi.login_InEnglish);

      const registerToService: string = await browser.findElement(By.className("applyToBeAMember")).getText();

      registerToService.should.equal(fi.login_RegisterToServiceText);

      const title: string = await browser.getTitle();
      title.should.equal(fi.login_Login_to + " " + service.display_name + " - TKO-äly ry");
    });
  }

  for (const service of serviceData) {
    it("On invalid username or password, shows correct error message (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText: string = await browser.findElement(By.className("error-text")).getText();
      errorText.should.equal("Invalid username or password");

      const containerTitle: string = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(en.login_Login);

      const usernameLabel: string = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(en.login_UsernameLabel);

      const passwordLabel: string = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(en.login_PasswordLabel);

      const usernamePlaceholder: string = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder: string = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(en.login_PasswordPlaceholder);

      const acceptValue: string = await browser.findElement(By.className("accept")).getAttribute("value");
      acceptValue.should.equal(en.login_LoginButton);

      const loginInFinnish: string = await browser.findElement(By.className("loginInFinnish")).getText();
      loginInFinnish.should.equal(en.login_InFinnish);

      const registerToService: string = await browser.findElement(By.className("applyToBeAMember")).getText();

      registerToService.should.equal(en.login_RegisterToServiceText);

      const title: string = await browser.getTitle();
      title.should.equal(en.login_Login_to + " " + service.display_name + " - TKO-äly ry");
    });
  }
}).timeout(5000);

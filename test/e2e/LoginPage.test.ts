import { By, WebDriver } from "selenium-webdriver";
import { cleanupDriver, prepareDriver } from "../WebDriver";

import "mocha";

import { knexInstance } from "../../src/Db";

import { ServiceDatabaseObject } from "../../src/models/Service";

import { Server } from "http";
import app from "../../src/App";

import en from "../../locales/en.json";
import fi from "../../locales/fi.json";
import services = require("../../seeds/seedData/services");

process.env.NODE_ENV = "test";

// Knex instance
const knex = knexInstance;

const serviceData = services as ServiceDatabaseObject[];

const port = 3010;

describe("Login page", () => {
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

  it("Missing service identifier should show the correct error page (Finnish)", async () => {
    await browser.get("http://localhost:3010/lang/fi/");

    const title = await browser.getTitle();

    title.should.equal(fi.error_Title + " - TKO-äly ry");
    const contentTitle = await browser.findElement(By.id("title")).getText();

    contentTitle.should.equal(fi.error_Title);

    const errorText = await browser.findElement(By.className("error-text")).getText();

    errorText.should.equal("Missing service identifier");
  });

  it("Missing service identifier should show the correct error page (English)", async () => {
    await browser.get("http://localhost:3010/lang/en/");

    const title = await browser.getTitle();

    title.should.equal(en.error_Title + " - TKO-äly ry");
    const contentTitle = await browser.findElement(By.id("title")).getText();

    contentTitle.should.equal(en.error_Title);

    const errorText = await browser.findElement(By.className("error-text")).getText();

    errorText.should.equal("Missing service identifier");
  });

  for (const service of serviceData) {
    it("Login page is shown correctly (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);

      const title = await browser.getTitle();

      title.should.equal(fi.login_Login_to + " " + service.display_name + " - TKO-äly ry");
      const contentTitle = await browser.findElement(By.id("title")).getText();

      contentTitle.should.equal(fi.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(fi.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(fi.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");

      passwordPlaceholder.should.equal(fi.login_PasswordPlaceholder);

      const acceptInput = await browser.findElement(By.className("input accept")).getAttribute("value");
      acceptInput.should.equal(fi.login_LoginButton);

      const loginInEnglish = await browser.findElement(By.className("loginInEnglish")).getText();
      loginInEnglish.should.equal(fi.login_InEnglish);

      const applyToBeAMember = await browser.findElement(By.className("applyToBeAMember")).getText();
      applyToBeAMember.should.equal(fi.login_RegisterToServiceText);

      const csrf = await browser.findElement(By.name("_csrf")).getAttribute("value");
      csrf.should.not.equal("");
    });
  }

  for (const service of serviceData) {
    it("Login page is shown correctly (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      const title = await browser.getTitle();
      title.should.equal(en.login_Login_to + " " + service.display_name + " - TKO-äly ry");
      const containerTitle = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(en.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(en.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(en.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(en.login_PasswordPlaceholder);

      const accept = await browser.findElement(By.className("accept")).getAttribute("value");
      accept.should.equal(en.login_LoginButton);

      const loginInFinnish = await browser.findElement(By.className("loginInFinnish")).getText();
      loginInFinnish.should.equal(en.login_InFinnish);

      const applyToBeAMember = await browser.findElement(By.className("applyToBeAMember")).getText();
      applyToBeAMember.should.equal(en.login_RegisterToServiceText);

      const csrf = await browser.findElement(By.name("_csrf")).getAttribute("value");
      csrf.should.not.equal("");
    });
  }

  for (const service of serviceData) {
    it("On invalid username or password, shows correct error message (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);
      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText = await browser.findElement(By.className("error-text")).getText();
      errorText.should.equal("Invalid username or password");

      const containerTitle = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(fi.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(fi.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(fi.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(fi.login_PasswordPlaceholder);

      const acceptValue = await browser.findElement(By.className("accept")).getAttribute("value");
      acceptValue.should.equal(fi.login_LoginButton);

      const loginInEnglish = await browser.findElement(By.className("loginInEnglish")).getText();
      loginInEnglish.should.equal(fi.login_InEnglish);

      const registerToService = await browser.findElement(By.className("applyToBeAMember")).getText();

      registerToService.should.equal(fi.login_RegisterToServiceText);

      const title = await browser.getTitle();
      title.should.equal(fi.login_Login_to + " " + service.display_name + " - TKO-äly ry");
    });
  }

  for (const service of serviceData) {
    it("On invalid username or password, shows correct error message (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText = await browser.findElement(By.className("error-text")).getText();
      errorText.should.equal("Invalid username or password");

      const containerTitle = await browser.findElement(By.id("title")).getText();
      containerTitle.should.equal(en.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      usernameLabel.should.equal(en.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      passwordLabel.should.equal(en.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      usernamePlaceholder.should.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      passwordPlaceholder.should.equal(en.login_PasswordPlaceholder);

      const acceptValue = await browser.findElement(By.className("accept")).getAttribute("value");
      acceptValue.should.equal(en.login_LoginButton);

      const loginInFinnish = await browser.findElement(By.className("loginInFinnish")).getText();
      loginInFinnish.should.equal(en.login_InFinnish);

      const registerToService = await browser.findElement(By.className("applyToBeAMember")).getText();

      registerToService.should.equal(en.login_RegisterToServiceText);

      const title = await browser.getTitle();
      title.should.equal(en.login_Login_to + " " + service.display_name + " - TKO-äly ry");
    });
  }
}).timeout(5000);

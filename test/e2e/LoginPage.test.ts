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

process.env.NODE_ENV = "test";

const serviceData = services as ServiceDatabaseObject[];

const port = 3010;

describe("Login page", () => {
  let browser: WebDriver;
  let express: Server;

  beforeAll(async () => {
    browser = await prepareDriver()

    await new Promise<void>((resolve) => {
      express = app.listen(port, () => resolve());
    })
  });

  afterAll(async () => {
    await cleanupDriver(browser)
    await new Promise<void>((resolve) => express.close(() => resolve()));
  });

  // Roll back
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  // After each
  afterEach(async () => {
    await knex.migrate.rollback();
  });

  test("Missing service identifier should show the correct error page (Finnish)", async () => {
    await browser.get("http://localhost:3010/lang/fi/");

    const title = await browser.getTitle();

    expect(title).to.equal(fi.serviceError_title + " - TKO-äly ry");
    const contentTitle = await browser.findElement(By.id("title")).getText();

    expect(contentTitle).to.equal(fi.serviceError_title);

    const errorText = await browser.findElement(By.className("error-text")).getText();

    expect(errorText).to.equal("Missing service identifier");
  });

  test("Missing service identifier should show the correct error page (English)", async () => {
    await browser.get("http://localhost:3010/lang/en/");

    const title = await browser.getTitle();

    expect(title).to.equal(en.serviceError_title + " - TKO-äly ry");
    const contentTitle = await browser.findElement(By.id("title")).getText();

    expect(contentTitle).to.equal(en.serviceError_title);

    const errorText = await browser.findElement(By.className("error-text")).getText();

    expect(errorText).to.equal("Missing service identifier");
  });

  for (const service of serviceData) {
    test("Login page is shown correctly (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);

      const title = await browser.getTitle();

      expect(title).to.equal(fi.login_title + " - TKO-äly ry");
      const contentTitle = await browser.findElement(By.id("title")).getText();

      expect(contentTitle).to.equal(fi.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      expect(usernameLabel).to.equal(fi.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      expect(passwordLabel).to.equal(fi.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      expect(usernamePlaceholder).to.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");

      expect(passwordPlaceholder).to.equal(fi.login_PasswordPlaceholder);

      const acceptInput = await browser.findElement(By.className("input accept")).getAttribute("value");
      expect(acceptInput).to.equal(fi.login_LoginButton);

      const loginInEnglish = await browser.findElement(By.className("loginInEnglish")).getText();
      expect(loginInEnglish).to.equal(fi.login_InEnglish);

      const applyToBeAMember = await browser.findElement(By.className("applyToBeAMember")).getText();
      expect(applyToBeAMember).to.equal(fi.login_RegisterToServiceText);

      const csrf = await browser.findElement(By.name("_csrf")).getAttribute("value");
      expect(csrf).to.not.equal("");
    });
  }

  for (const service of serviceData) {
    test("Login page is shown correctly (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      const title = await browser.getTitle();
      expect(title).to.equal(en.login_title + " - TKO-äly ry");
      const containerTitle = await browser.findElement(By.id("title")).getText();
      expect(containerTitle).to.equal(en.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      expect(usernameLabel).to.equal(en.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      expect(passwordLabel).to.equal(en.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      expect(usernamePlaceholder).to.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      expect(passwordPlaceholder).to.equal(en.login_PasswordPlaceholder);

      const accept = await browser.findElement(By.className("accept")).getAttribute("value");
      expect(accept).to.equal(en.login_LoginButton);

      const loginInFinnish = await browser.findElement(By.className("loginInFinnish")).getText();
      expect(loginInFinnish).to.equal(en.login_InFinnish);

      const applyToBeAMember = await browser.findElement(By.className("applyToBeAMember")).getText();
      expect(applyToBeAMember).to.equal(en.login_RegisterToServiceText);

      const csrf = await browser.findElement(By.name("_csrf")).getAttribute("value");
      expect(csrf).to.not.equal("");
    });
  }

  for (const service of serviceData) {
    test("On invalid username or password, shows correct error message (Finnish) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/fi/" + service.service_identifier);
      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText = await browser.findElement(By.className("error-text")).getText();
      expect(errorText).to.equal("Invalid username or password");

      const containerTitle = await browser.findElement(By.id("title")).getText();
      expect(containerTitle).to.equal(fi.login_title);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      expect(usernameLabel).to.equal(fi.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      expect(passwordLabel).to.equal(fi.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      expect(usernamePlaceholder).to.equal(fi.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      expect(passwordPlaceholder).to.equal(fi.login_PasswordPlaceholder);

      const acceptValue = await browser.findElement(By.className("accept")).getAttribute("value");
      expect(acceptValue).to.equal(fi.login_LoginButton);

      const loginInEnglish = await browser.findElement(By.className("loginInEnglish")).getText();
      expect(loginInEnglish).to.equal(fi.login_InEnglish);

      const registerToService = await browser.findElement(By.className("applyToBeAMember")).getText();

      expect(registerToService).to.equal(fi.login_RegisterToServiceText);

      const title = await browser.getTitle();
      expect(title).to.equal(fi.login_title + " - TKO-äly ry");
    });
  }

  for (const service of serviceData) {
    test("On invalid username or password, shows correct error message (English) - " + service.display_name, async () => {
      await browser.get("http://localhost:3010/lang/en/" + service.service_identifier);

      await browser.findElement(By.id("username")).sendKeys("test_user");
      await browser.findElement(By.id("password")).sendKeys("wrong_password");
      await browser.findElement(By.className("accept")).click();

      const errorText = await browser.findElement(By.className("error-text")).getText();
      expect(errorText).to.equal("Invalid username or password");

      const containerTitle = await browser.findElement(By.id("title")).getText();
      expect(containerTitle).to.equal(en.login_Login);

      const usernameLabel = await browser.findElement(By.className("usernameLabel")).getText();
      expect(usernameLabel).to.equal(en.login_UsernameLabel);

      const passwordLabel = await browser.findElement(By.className("passwordLabel")).getText();
      expect(passwordLabel).to.equal(en.login_PasswordLabel);

      const usernamePlaceholder = await browser.findElement(By.id("username")).getAttribute("placeholder");
      expect(usernamePlaceholder).to.equal(en.login_UsernamePlaceholder);

      const passwordPlaceholder = await browser.findElement(By.id("password")).getAttribute("placeholder");
      expect(passwordPlaceholder).to.equal(en.login_PasswordPlaceholder);

      const acceptValue = await browser.findElement(By.className("accept")).getAttribute("value");
      expect(acceptValue).to.equal(en.login_LoginButton);

      const loginInFinnish = await browser.findElement(By.className("loginInFinnish")).getText();
      expect(loginInFinnish).to.equal(en.login_InFinnish);

      const registerToService = await browser.findElement(By.className("applyToBeAMember")).getText();

      expect(registerToService).to.equal(en.login_RegisterToServiceText);

      const title = await browser.getTitle();
      expect(title).to.equal(en.login_title + " - TKO-äly ry");
    });
  }
});

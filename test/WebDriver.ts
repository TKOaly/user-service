import * as webdriver from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome";

export const prepareDriver: () => Promise<webdriver.WebDriver> = async (): Promise<webdriver.WebDriver> => {
  process.on("beforeExit", () => this.browser && this.browser.quit());

  return await new webdriver.Builder()
    .disableEnvironmentOverrides()
    .forBrowser("chrome")
    .setChromeOptions(
      new chrome.Options()
        .headless()
        .addArguments("no-sandbox")
    )
    .setLoggingPrefs({ browser: "ALL", driver: "ALL" })
    .build();
};

export const cleanupDriver: (
  driver: webdriver.WebDriver
) => Promise<void> = async (driver: webdriver.WebDriver): Promise<void> => {
  if (driver) {
    await driver.quit();
  }
};

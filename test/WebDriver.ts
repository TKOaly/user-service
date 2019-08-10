import { Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";

export const prepareDriver: () => Promise<WebDriver> = async (): Promise<WebDriver> => {
  // @ts-ignore
  process.on("beforeExit", () => this.browser && this.browser.quit());

  return await new Builder()
    .disableEnvironmentOverrides()
    .forBrowser("chrome")
    .setChromeOptions(new Options().headless().addArguments("no-sandbox"))
    .setLoggingPrefs({ browser: "ALL", driver: "ALL" })
    .build();
};

export const cleanupDriver: (driver: WebDriver) => Promise<void> = async (driver: WebDriver): Promise<void> => {
  if (driver) {
    await driver.quit();
  }
};

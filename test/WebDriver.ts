import * as chromeDriver from "chromedriver";
import * as path from "path";
import * as webdriver from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome";

const chromeDriverPathAddition: string = `:${path.dirname(chromeDriver.path)}`;

export const prepareDriver: () => Promise<
  webdriver.WebDriver
> = async (): Promise<webdriver.WebDriver> => {
  process.on("beforeExit", () => this.browser && this.browser.quit());
  process.env.PATH += chromeDriverPathAddition;

  return await new webdriver.Builder()
    .disableEnvironmentOverrides()
    .forBrowser("chrome")
    .setChromeOptions(
      new chrome.Options().headless().addArguments("disable-gpu")
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
  process.env.PATH = process.env.PATH.replace(chromeDriverPathAddition, "");
};

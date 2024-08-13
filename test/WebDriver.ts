import { Browser, Builder, WebDriver } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome";

export const prepareDriver: () => Promise<WebDriver> = async (): Promise<WebDriver> => {
  const browser = await new Builder()
    .disableEnvironmentOverrides()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(new Options().addArguments("--no-sandbox", "--headless=new"))
    .setLoggingPrefs({ browser: "ALL", driver: "ALL" })
    .build();

  process.on("beforeExit", () => cleanupDriver(browser));

  return browser;
};

export const cleanupDriver: (driver: WebDriver) => Promise<void> = async (driver: WebDriver): Promise<void> => {
  if (driver) {
    await driver.quit();
  }
};

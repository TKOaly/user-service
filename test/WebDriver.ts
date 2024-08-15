import { Browser, Builder, Capabilities, WebDriver } from "selenium-webdriver";

export const prepareDriver: () => Promise<WebDriver> = async (): Promise<WebDriver> => {
  const capabilities = Capabilities.chrome();
  capabilities.set("goog:chromeOptions", {
    args: ["--no-sandbox", "--headless"],
  });

  const browser = await new Builder()
    .disableEnvironmentOverrides()
    .forBrowser(Browser.CHROME)
    .withCapabilities(capabilities)
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

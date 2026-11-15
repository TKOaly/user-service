import i18next from "i18next";
import { handle, LanguageDetector } from "i18next-http-middleware";
import Backend from "i18next-fs-backend";
import { Express } from "express";
import { readdirSync, lstatSync } from "fs";
import { join } from "path";
import { logger } from "./logger";

const LOCALES_PATH = join(process.cwd(), "locales");

const preload = readdirSync(LOCALES_PATH)
  .filter(filename => {
    const filepath = join(LOCALES_PATH, filename);
    const info = lstatSync(filepath);

    return info.isFile() && filename.endsWith(".json");
  })
  .map(filename => filename.substring(0, filename.length - 5));

i18next
  .use(LanguageDetector)
  .use(Backend)
  .init({
    fallbackLng: "fi",
    preload,
    backend: {
      loadPath: join(LOCALES_PATH, "{{lng}}.json"),
    },
    missingKeyHandler: (lngs, ns, key) => {
      logger.warn({ key, languages: lngs, namespace: ns }, "Missing translation key");
    },
    detection: {
      lookupCookie: "tkoaly_locale",
    },
  });

const init = (app: Express) => {
  app.use(handle(i18next, {}));

  app.use((req, res, next) => {
    res.locals.language = req.language;
    next();
  });
};

export default init;

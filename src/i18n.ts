import i18n from "i18n";
import { join } from "path";
import { Env } from "./env";

export const initI18n = (env: Env) => {
  i18n.configure({
    locales: ["fi", "en"],
    defaultLocale: env.DEFAULT_LOCALE,
    cookie: "tkoaly_locale",
    directory: join(process.cwd(), "locales"),
    api: {
      __: "t",
      __n: "tn",
    },
  });

  return i18n.init;
};

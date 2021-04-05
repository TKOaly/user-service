import i18n from "i18n";
import { join } from "path";

i18n.configure({
  locales: ["fi", "en"],
  defaultLocale: process.env.DEFAULT_LOCALE,
  cookie: "tkoaly_locale",
  directory: join(process.cwd(), "locales"),
  api: {
    __: "t",
    __n: "tn",
  },
});

export default i18n;

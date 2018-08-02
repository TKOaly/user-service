import * as i18n from "i18n";
import * as path from "path";

i18n.configure({
  locales: ["fi", "en"],
  defaultLocale: process.env.DEFAULT_LOCALE,
  cookie: "tkoaly_locale",
  directory: path.resolve(path.join(__dirname, "..", "locales")),
  api: {
    __: "t", //now req.__ becomes req.t
    __n: "tn" //and req.__n can be called as req.tn
  }
});

export default i18n;

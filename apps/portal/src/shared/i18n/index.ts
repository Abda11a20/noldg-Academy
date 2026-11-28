import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { brand } from "@noldg/ui";
import arCommon from "./locales/ar/common.json";
import arErrors from "./locales/ar/errors.json";
import arAuth from "./locales/ar/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enAuth from "./locales/en/auth.json";

const resources = {
  ar: {
    common: arCommon,
    errors: arErrors,
    auth: arAuth,
  },
  en: {
    common: enCommon,
    errors: enErrors,
    auth: enAuth,
  },
} as const;

void i18next.use(initReactI18next).init({
  resources,
  lng: brand.defaultLanguage,
  fallbackLng: brand.defaultLanguage,
  supportedLngs: [...brand.supportedLanguages],
  defaultNS: "common",
  ns: ["common", "errors", "auth"],
  interpolation: { escapeValue: false },
  react: { bindI18nStore: "added" },
  returnNull: false,
});

export default i18next;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof resources.en & {
      admin: typeof import("./locales/en/admin.json");
      browse: typeof import("./locales/en/browse.json");
      catalog: typeof import("./locales/en/catalog.json");
      orders: typeof import("./locales/en/orders.json");
      learning: typeof import("./locales/en/learning.json");
      questions: typeof import("./locales/en/questions.json");
      gallery: typeof import("./locales/en/gallery.json");
    };
    returnNull: false;
  }
}

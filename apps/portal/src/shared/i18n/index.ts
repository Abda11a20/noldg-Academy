import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { brand } from "@noldg/ui";
import arCommon from "./locales/ar/common.json";
import arErrors from "./locales/ar/errors.json";
import arAuth from "./locales/ar/auth.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";
import enAuth from "./locales/en/auth.json";
import arAdmin from "./locales/ar/admin.json";
import enAdmin from "./locales/en/admin.json";

const resources = {
  ar: { common: arCommon, errors: arErrors, auth: arAuth, admin: arAdmin },
  en: { common: enCommon, errors: enErrors, auth: enAuth, admin: enAdmin },
} as const;

void i18next.use(initReactI18next).init({
  resources,
  lng: brand.defaultLanguage,
  fallbackLng: brand.defaultLanguage,
  supportedLngs: [...brand.supportedLanguages],
  defaultNS: "common",
  ns: ["common", "errors", "auth", "admin"],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18next;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: typeof resources.en;
    returnNull: false;
  }
}

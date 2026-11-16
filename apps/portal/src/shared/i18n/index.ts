import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { brand } from "@noldg/ui";
import arCommon from "./locales/ar/common.json";
import arErrors from "./locales/ar/errors.json";
import enCommon from "./locales/en/common.json";
import enErrors from "./locales/en/errors.json";

const resources = {
  ar: { common: arCommon, errors: arErrors },
  en: { common: enCommon, errors: enErrors },
} as const;

void i18next.use(initReactI18next).init({
  resources,
  lng: brand.defaultLanguage,
  fallbackLng: brand.defaultLanguage,
  supportedLngs: [...brand.supportedLanguages],
  defaultNS: "common",
  ns: ["common", "errors"],
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

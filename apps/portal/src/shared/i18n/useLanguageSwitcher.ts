import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Provides the translated label and action for the Arabic/English language switch. */
export function useLanguageSwitcher() {
  const { t, i18n } = useTranslation("common");
  const nextLanguage = i18n.resolvedLanguage?.startsWith("ar") ? "en" : "ar";
  const label = nextLanguage === "ar" ? t("languageArabic") : t("languageEnglish");
  const changeLanguage = useCallback(() => {
    void i18n.changeLanguage(nextLanguage);
  }, [i18n, nextLanguage]);

  return { label, accessibleLabel: t("changeLanguage"), changeLanguage };
}

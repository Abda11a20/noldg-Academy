import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Keeps the document language and text direction synchronized with the active locale. */
export function useDocumentLanguage(): void {
  const { i18n, t } = useTranslation("common");

  useEffect(() => {
    const updateDocument = (language: string) => {
      const isArabic = language.startsWith("ar");
      document.documentElement.lang = isArabic ? "ar" : "en";
      document.documentElement.dir = isArabic ? "rtl" : "ltr";
      document.title = t("appName");
    };
    updateDocument(i18n.resolvedLanguage ?? i18n.language);
    i18n.on("languageChanged", updateDocument);
    return () => i18n.off("languageChanged", updateDocument);
  }, [i18n, t]);
}

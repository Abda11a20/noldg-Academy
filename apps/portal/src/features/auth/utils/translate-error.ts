import i18n from "../../../shared/i18n";

/** Resolves a normalized error key through active i18n resources with a safe generic fallback. @param key App error message key. */
export function translateAuthMessage(key: string): string {
  const translated = String(i18n.t(key as never));
  return translated === key ? i18n.t("errors:requestFailed") : translated;
}

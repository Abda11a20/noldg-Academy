const NUMBER_LOCALE = "en-EG";
const ARABIC_LOCALE = "ar-EG";
const ENGLISH_LOCALE = "en-EG";
const EGP_CURRENCY = "EGP";
const BYTES_PER_KILOBYTE = 1024;

/** Formats a number with Latin digits and Egyptian grouping. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2 }).format(value);
}

/** Selects a formatting locale from the active translation language. */
export function getFormattingLocale(language: string | undefined): string {
  return language?.startsWith("ar") ? ARABIC_LOCALE : ENGLISH_LOCALE;
}

/** Formats a server-supplied integer or decimal amount as Egyptian pounds using Latin digits. */
export function formatMoney(value: number | string): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: "currency",
    currency: EGP_CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/** Formats a file size with localized grouping and a binary megabyte unit. */
export function formatFileSize(bytes: number): string {
  const megabytes = bytes / (BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE);
  return `${formatNumber(megabytes)} MB`;
}

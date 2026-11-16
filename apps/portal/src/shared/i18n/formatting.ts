const NUMBER_LOCALE = "en-EG";
const DATE_TIME_ZONE = "Africa/Cairo";
const EGP_CURRENCY = "EGP";

/** Formats a number with Latin digits and Egyptian grouping. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2 }).format(value);
}

/** Formats a timestamp in the configured Cairo time zone. */
export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat(NUMBER_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: DATE_TIME_ZONE,
  }).format(value instanceof Date ? value : new Date(value));
}

/** Formats an integer or decimal amount as Egyptian pounds using Latin digits. */
export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, {
    style: "currency",
    currency: EGP_CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

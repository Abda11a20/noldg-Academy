import { normalizeArabicDigits } from "../normalize-arabic-digits";

const EGYPT_COUNTRY_CODE = "20";

/** Normalizes Egyptian local or international phone numbers for wa.me links.
 * @param value User or backend number, including Arabic-Indic digits.
 * @returns International digits, or null when the number is not an Egyptian mobile.
 */
export function normalizeEgyptianWhatsappNumber(value: string): string | null {
  const digits = normalizeArabicDigits(value).replace(/\D/g, "");
  const local = digits.startsWith(EGYPT_COUNTRY_CODE) ? digits.slice(2) : digits.replace(/^0/, "");
  return /^1[0125]\d{8}$/.test(local) ? `${EGYPT_COUNTRY_CODE}${local}` : null;
}

/** Builds a WhatsApp link with only the explicitly approved order details.
 * @param number Egyptian support or student phone number.
 * @param message Localized template containing the allowed order fields.
 * @returns wa.me URL or null for an invalid/empty number.
 */
export function buildWhatsappLink(number: string, message: string): string | null {
  const normalized = normalizeEgyptianWhatsappNumber(number);
  if (!normalized || !message.trim()) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

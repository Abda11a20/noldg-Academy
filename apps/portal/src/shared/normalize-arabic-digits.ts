const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Converts Arabic-Indic and Persian numeral glyphs to Latin digits. @param value User-entered phone or OTP text. */
export function normalizeArabicDigits(value: string): string {
  return [...value]
    .map((character) => {
      const arabicIndex = ARABIC_INDIC_DIGITS.indexOf(character);
      if (arabicIndex >= 0) return String(arabicIndex);
      const persianIndex = PERSIAN_DIGITS.indexOf(character);
      return persianIndex >= 0 ? String(persianIndex) : character;
    })
    .join("");
}

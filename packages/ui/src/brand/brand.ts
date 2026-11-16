/** Brand identity configuration shared by the portal and UI package. */
export const brand = {
  name: { ar: "Noldg Academy", en: "Noldg Academy" },
  ownerConfirmation: "TODO: owner to confirm platform name",
  logoAsset: "wordmark",
  supportedLanguages: ["ar", "en"] as const,
  defaultLanguage: "ar" as const,
} as const;

export type SupportedLanguage = (typeof brand.supportedLanguages)[number];

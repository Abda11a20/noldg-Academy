import { Button } from "@noldg/ui";
import { useLanguageSwitcher } from "../i18n/useLanguageSwitcher";

/** Switches between Arabic and English using the accessible shared button. */
export function LanguageSwitcher() {
  const { label, changeLanguage, accessibleLabel } = useLanguageSwitcher();

  return (
    <Button aria-label={accessibleLabel} iconStart="globe" onClick={changeLanguage} variant="ghost">
      {label}
    </Button>
  );
}

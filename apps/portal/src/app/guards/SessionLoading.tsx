import { useTranslation } from "react-i18next";
import { Spinner, Text } from "@noldg/ui";

/** Shows a neutral, localized loading state while the existing session is checked. */
export function SessionLoading() {
  const { t } = useTranslation("common");
  return (
    <main
      aria-live="polite"
      className="mx-auto flex min-h-screen items-center justify-center gap-3 px-4"
    >
      <Spinner />
      <Text>{t("loading")}</Text>
    </main>
  );
}

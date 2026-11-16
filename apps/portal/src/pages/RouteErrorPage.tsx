import { useTranslation } from "react-i18next";

/** Renders a generic route-level error message with no raw server details. */
export function RouteErrorPage() {
  const { t } = useTranslation("common");
  return (
    <main className="mx-auto max-w-prose px-4 py-12 text-center">
      <h1 className="text-xl font-semibold">{t("routeErrorTitle")}</h1>
    </main>
  );
}

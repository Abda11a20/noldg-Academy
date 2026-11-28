import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import { ROUTE_PATHS } from "../shared/navigation/routes";

/** Renders a generic route-level error message with safe recovery actions and no raw server details. */
export function RouteErrorPage() {
  const { t } = useTranslation("common");
  return (
    <main className="mx-auto max-w-prose px-4 py-12 text-center">
      <h1 className="text-xl font-semibold">{t("routeErrorTitle")}</h1>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
        <Button to={ROUTE_PATHS.login} variant="secondary">
          {t("goHome")}
        </Button>
      </div>
    </main>
  );
}

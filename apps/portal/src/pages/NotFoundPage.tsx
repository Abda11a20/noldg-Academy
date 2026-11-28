import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import { ROUTE_PATHS } from "../shared/navigation/routes";

/** Renders the translated not-found route without exposing implementation details. */
export function NotFoundPage() {
  const { t } = useTranslation("common");
  return (
    <section className="mx-auto max-w-prose py-12 text-center">
      <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-foreground-muted">{t("notFoundBody")}</p>
      <div className="mt-6 flex justify-center">
        <Button to={ROUTE_PATHS.login}>{t("goHome")}</Button>
      </div>
    </section>
  );
}

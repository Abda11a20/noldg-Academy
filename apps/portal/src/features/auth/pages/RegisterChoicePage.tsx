import { useTranslation } from "react-i18next";
import { Button, Link, Stack } from "@noldg/ui";
import { AuthPanel } from "../components/AuthPanel";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";

/** Lets visitors choose student registration or teacher application. */
export function RegisterChoicePage() {
  const { t } = useTranslation("auth");
  return (
    <AuthPanel title={t("register.title")} subtitle={t("register.subtitle")}>
      <Stack className="gap-3">
        <Button fullWidth to={ROUTE_PATHS.studentRegister}>
          {t("register.student")}
        </Button>
        <Button fullWidth to={ROUTE_PATHS.teacherRegister} variant="secondary">
          {t("register.teacher")}
        </Button>
        <Link to={ROUTE_PATHS.login}>{t("register.loginLink")}</Link>
      </Stack>
    </AuthPanel>
  );
}

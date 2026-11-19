import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Link, Stack } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AuthPanel } from "../components/AuthPanel";
import { StudentRegistrationFields } from "../components/StudentRegistrationFields";
import { useStudentRegistration } from "../hooks/useRegistration";
import { translateAuthMessage } from "../utils/translate-error";

/** Renders the student signup flow and explains catalog availability safely. */
export function StudentRegistrationPage() {
  const { t } = useTranslation("auth");
  const [system, setSystem] = useState("");
  const registration = useStudentRegistration();
  const tracks = registration.catalog?.tracks.filter((track) => track.system === system) ?? [];
  const serverError = registration.errorKey
    ? translateAuthMessage(registration.errorKey)
    : undefined;
  const loadCatalog = registration.loadCatalog;
  const changeSystem = (value: string) => {
    setSystem(value);
    registration.form.setValue("trackId", "", { shouldValidate: true });
  };

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return (
    <AuthPanel title={t("student.title")} subtitle={t("student.subtitle")}>
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      {registration.unavailable ? (
        <Alert
          tone="warning"
          action={
            <Button onClick={() => void loadCatalog()} size="sm" variant="secondary">
              {t("student.catalogRetry")}
            </Button>
          }
        >
          {t("student.catalogUnavailable")}
        </Alert>
      ) : null}
      <StudentRegistrationFields
        onSystemChange={changeSystem}
        registration={registration}
        system={system}
        tracks={tracks}
      />
      <Stack className="gap-2">
        <Link to={ROUTE_PATHS.register}>{t("register.title")}</Link>
        <Link to={ROUTE_PATHS.login}>{t("register.loginLink")}</Link>
      </Stack>
    </AuthPanel>
  );
}

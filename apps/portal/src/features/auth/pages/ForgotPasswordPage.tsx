import { useTranslation } from "react-i18next";
import { Alert, Button, Link, TextField } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AuthPanel } from "../components/AuthPanel";
import { useForgotPasswordFlow } from "../hooks/useCodeFlow";
import { translateAuthMessage } from "../utils/translate-error";
import { fieldErrorProps } from "../utils/field-error-props";

/** Renders the first password-recovery step and keeps the email in router state only. */
export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const flow = useForgotPasswordFlow();
  return (
    <AuthPanel title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      {flow.errorKey ? <Alert tone="danger">{translateAuthMessage(flow.errorKey)}</Alert> : null}
      <form className="flex flex-col gap-4" noValidate onSubmit={flow.submit}>
        <TextField
          autoComplete="email"
          {...fieldErrorProps(flow.form.formState.errors.email)}
          id="forgot-email"
          inputMode="email"
          label={t("forgot.email")}
          {...flow.form.register("email")}
        />
        <Button disabled={flow.pending} loading={flow.pending} type="submit" fullWidth>
          {t("forgot.submit")}
        </Button>
      </form>
      <Link to={ROUTE_PATHS.login}>{t("login.submit")}</Link>
    </AuthPanel>
  );
}

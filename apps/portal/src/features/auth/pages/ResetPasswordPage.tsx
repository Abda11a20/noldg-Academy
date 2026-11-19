import { useTranslation } from "react-i18next";
import { Alert, Button, Link, OtpInput, PasswordField, Text } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { AuthPanel } from "../components/AuthPanel";
import { useResetPasswordFlow } from "../hooks/useCodeFlow";
import { translateAuthMessage } from "../utils/translate-error";
import { fieldErrorProps } from "../utils/field-error-props";

/** Renders recovery code and new-password confirmation without storing secrets in URLs. */
export function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const flow = useResetPasswordFlow();
  const code = flow.form.watch("code");
  if (!flow.email) {
    return (
      <AuthPanel title={t("reset.title")} subtitle={t("forgot.subtitle")}>
        <Link to={ROUTE_PATHS.forgotPassword}>{t("forgot.submit")}</Link>
      </AuthPanel>
    );
  }
  return (
    <AuthPanel title={t("reset.title")} subtitle={t("reset.subtitle")}>
      {flow.errorKey ? <Alert tone="danger">{translateAuthMessage(flow.errorKey)}</Alert> : null}
      <Text tone="muted">{flow.email}</Text>
      <OtpInput
        digitLabels={Array.from({ length: 6 }, (_, index) =>
          t("verify.digitLabel", { number: index + 1 }),
        )}
        disabled={flow.pending}
        groupLabel={t("reset.code")}
        normalizeDigits={normalizeArabicDigits}
        onChange={(value) => {
          flow.form.setValue("code", value, { shouldValidate: true });
        }}
        value={code}
      />
      <form className="flex flex-col gap-4" noValidate onSubmit={flow.submit}>
        <PasswordField
          autoComplete="new-password"
          {...fieldErrorProps(flow.form.formState.errors.password)}
          hint={t("passwordHint")}
          hideLabel={t("login.hidePassword")}
          id="reset-password"
          label={t("reset.password")}
          showLabel={t("login.showPassword")}
          {...flow.form.register("password")}
        />
        <PasswordField
          autoComplete="new-password"
          {...fieldErrorProps(flow.form.formState.errors.passwordConfirmation)}
          hideLabel={t("login.hidePassword")}
          id="reset-password-confirmation"
          label={t("reset.confirmPassword")}
          showLabel={t("login.showPassword")}
          {...flow.form.register("passwordConfirmation")}
        />
        <Button
          disabled={flow.pending || code.length !== 6}
          loading={flow.pending}
          type="submit"
          fullWidth
        >
          {t("reset.submit")}
        </Button>
      </form>
    </AuthPanel>
  );
}

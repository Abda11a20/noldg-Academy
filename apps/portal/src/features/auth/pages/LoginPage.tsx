import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { Button, Link, PasswordField, Stack, TextField } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AuthPanel } from "../components/AuthPanel";
import { useLoginForm } from "../hooks/useLoginForm";
import { sanitizeReturnTo } from "../utils/return-to";
import { translateAuthMessage } from "../utils/translate-error";
import { LoginNotices } from "../components/LoginNotices";
import { fieldErrorProps } from "../utils/field-error-props";

/** Renders the login form and localized links to account creation and recovery. */
export function LoginPage() {
  const { t } = useTranslation("auth");
  const location = useLocation();
  const notice = location.state as {
    verified?: boolean;
    passwordReset?: boolean;
    verificationUnavailable?: boolean;
  } | null;
  const { form, submit, pending, errorKey, secondsRemaining } = useLoginForm();
  const returnTo = sanitizeReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
  const loginError = errorKey ? translateAuthMessage(errorKey) : undefined;
  const disabled = pending || secondsRemaining > 0;

  return (
    <AuthPanel title={t("login.title")} subtitle={t("login.subtitle")}>
      <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
        <LoginNotices
          error={loginError}
          passwordReset={notice?.passwordReset === true}
          returnTo={Boolean(returnTo)}
          secondsRemaining={secondsRemaining}
          verificationUnavailable={notice?.verificationUnavailable === true}
          verified={notice?.verified === true}
        />
        <TextField
          autoComplete="username"
          {...fieldErrorProps(form.formState.errors.email)}
          id="login-email"
          inputMode="email"
          label={t("login.email")}
          {...form.register("email")}
        />
        <PasswordField
          autoComplete="current-password"
          {...fieldErrorProps(form.formState.errors.password)}
          hideLabel={t("login.hidePassword")}
          id="login-password"
          label={t("login.password")}
          showLabel={t("login.showPassword")}
          {...form.register("password")}
        />
        <Button disabled={disabled} loading={pending} type="submit" fullWidth>
          {t("login.submit")}
        </Button>
      </form>
      <Stack className="gap-2">
        <Link to={ROUTE_PATHS.forgotPassword}>{t("login.forgotLink")}</Link>
        <Link to={ROUTE_PATHS.register}>{t("login.registerLink")}</Link>
      </Stack>
    </AuthPanel>
  );
}

import { Alert, Text } from "@noldg/ui";
import { useTranslation } from "react-i18next";

export interface LoginNoticesProps {
  verified: boolean;
  passwordReset: boolean;
  verificationUnavailable: boolean;
  returnTo: boolean;
  error?: string | undefined;
  secondsRemaining: number;
}

/** Renders translated one-time login status messages and cooldown information. @param props Flow results without credentials. */
export function LoginNotices({
  verified,
  passwordReset,
  verificationUnavailable,
  returnTo,
  error,
  secondsRemaining,
}: LoginNoticesProps) {
  const { t } = useTranslation("auth");
  return (
    <>
      {verified ? <Alert tone="success">{t("verify.success")}</Alert> : null}
      {passwordReset ? <Alert tone="success">{t("reset.success")}</Alert> : null}
      {verificationUnavailable ? (
        <Alert tone="warning">{t("student.verificationUnavailable")}</Alert>
      ) : null}
      {returnTo ? <Text tone="muted">{t("login.returnTo")}</Text> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {secondsRemaining > 0 ? (
        <Alert tone="warning">{t("login.rateLimit", { seconds: secondsRemaining })}</Alert>
      ) : null}
    </>
  );
}

import { Alert, Text } from "@noldg/ui";
import { useTranslation } from "react-i18next";

export interface VerifyEmailFeedbackProps {
  error?: string | undefined;
  teacherRegistrationReceived: boolean;
  remainingAttempts?: number | undefined;
  secondsRemaining: number;
}

/** Renders verification status, remaining attempts, and resend cooldown text. @param props Verification feedback without the OTP value. */
export function VerifyEmailFeedback({
  error,
  teacherRegistrationReceived,
  remainingAttempts,
  secondsRemaining,
}: VerifyEmailFeedbackProps) {
  const { t } = useTranslation("auth");
  return (
    <>
      {teacherRegistrationReceived ? (
        <Alert tone="success" title={t("teacher.applicationReceived")}>
          {t("teacher.applicationReceivedBody")}
        </Alert>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {remainingAttempts !== undefined ? (
        <Text tone="muted">{t("verify.attemptsLeft", { count: remainingAttempts })}</Text>
      ) : null}
      {secondsRemaining > 0 ? (
        <Text tone="muted">{t("verify.resendIn", { seconds: secondsRemaining })}</Text>
      ) : null}
    </>
  );
}

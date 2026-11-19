import { useTranslation } from "react-i18next";
import { Button, Link, OtpInput, Stack, Text } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { AuthPanel } from "../components/AuthPanel";
import { useVerifyEmailFlow } from "../hooks/useCodeFlow";
import { translateAuthMessage } from "../utils/translate-error";
import { VerifyEmailFeedback } from "../components/VerifyEmailFeedback";

/** Renders email verification, six-digit code entry, resend cooldown, and remaining attempts. */
export function VerifyEmailPage() {
  const { t } = useTranslation("auth");
  const flow = useVerifyEmailFlow();
  const error = flow.errorKey ? translateAuthMessage(flow.errorKey) : undefined;
  if (!flow.email || flow.state?.verificationUnavailable) {
    return (
      <AuthPanel title={t("verify.title")} subtitle={t("verify.unavailable")}>
        <Link to={ROUTE_PATHS.login}>{t("login.submit")}</Link>
      </AuthPanel>
    );
  }
  return (
    <AuthPanel title={t("verify.title")} subtitle={t("verify.subtitle")}>
      <VerifyEmailFeedback
        error={error}
        remainingAttempts={flow.remainingAttempts}
        secondsRemaining={flow.secondsRemaining}
        teacherRegistrationReceived={flow.state?.teacherRegistrationReceived === true}
      />
      <Text tone="muted">{flow.email}</Text>
      <OtpInput
        digitLabels={Array.from({ length: 6 }, (_, index) =>
          t("verify.digitLabel", { number: index + 1 }),
        )}
        disabled={flow.pending}
        error={Boolean(error)}
        groupLabel={t("verify.code")}
        normalizeDigits={normalizeArabicDigits}
        onChange={flow.setCode}
        value={flow.code}
      />
      <Stack className="gap-3">
        <Button
          disabled={flow.code.length !== 6 || flow.pending}
          loading={flow.pending}
          onClick={() => void flow.submit()}
          fullWidth
        >
          {t("verify.submit")}
        </Button>
        <Button
          disabled={!flow.canResend || flow.pending}
          loading={flow.pending}
          onClick={() => void flow.resend()}
          variant="secondary"
          fullWidth
        >
          {t("verify.resend")}
        </Button>
      </Stack>
    </AuthPanel>
  );
}

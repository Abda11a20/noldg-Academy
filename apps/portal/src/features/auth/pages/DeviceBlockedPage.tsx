import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Link, Textarea, Text } from "@noldg/ui";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { AuthPanel } from "../components/AuthPanel";
import { useDeviceChange } from "../hooks/useDeviceChange";
import { useLogout } from "../hooks/useLogout";
import { translateAuthMessage } from "../utils/translate-error";

/** Explains the active device restriction and presents request status or current capability limits. */
export function DeviceBlockedPage() {
  const { t } = useTranslation("auth");
  const flow = useDeviceChange();
  const logoutFlow = useLogout();
  const hasRequest = flow.status !== undefined;
  const loadStatus = flow.loadStatus;
  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);
  return (
    <AuthPanel title={t("device.title")} subtitle={t("device.body")}>
      {flow.errorKey ? <Alert tone="warning">{translateAuthMessage(flow.errorKey)}</Alert> : null}
      {hasRequest ? (
        <Alert tone={flow.status === "rejected" ? "danger" : "info"}>
          {t(
            flow.status === "pending"
              ? "device.pending"
              : flow.status === "approved"
                ? "device.approved"
                : "device.rejected",
          )}
        </Alert>
      ) : (
        <>
          <Textarea
            id="device-reason"
            label={t("device.reason")}
            value={flow.reason}
            onChange={(event) => flow.setReason(event.currentTarget.value)}
          />
          <Button
            disabled={flow.pending}
            loading={flow.pending}
            onClick={() => void flow.createRequest()}
            fullWidth
          >
            {t("device.request")}
          </Button>
        </>
      )}
      {!flow.requestAvailable ? <Text tone="muted">{t("device.unavailable")}</Text> : null}
      <Button
        loading={logoutFlow.loggingOut}
        onClick={() => void logoutFlow.signOut()}
        variant="secondary"
        fullWidth
      >
        {t("logout")}
      </Button>
      <Link to={ROUTE_PATHS.login}>{t("login.submit")}</Link>
    </AuthPanel>
  );
}

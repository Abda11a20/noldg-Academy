import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Button, Text } from "@noldg/ui";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { AuthPanel } from "../components/AuthPanel";
import { useLogout } from "../hooks/useLogout";

interface PendingPageState {
  teacherRegistrationReceived?: boolean;
}

/** Displays the teacher application state after signup or on return to the portal. */
export function TeacherPendingPage() {
  const { t } = useTranslation("auth");
  const user = useAuthSnapshot().user;
  const location = useLocation();
  const state = location.state as PendingPageState | null;
  const logout = useLogout();
  const rejected = user?.applicationStatus === "rejected";
  return (
    <AuthPanel
      title={t("pending.title")}
      subtitle={t(rejected ? "pending.rejected" : "pending.body")}
    >
      {state?.teacherRegistrationReceived ? (
        <Alert tone="success" title={t("teacher.applicationReceived")}>
          {t("teacher.applicationReceivedBody")}
        </Alert>
      ) : null}
      {rejected && user?.rejectionReason ? <Text>{user.rejectionReason}</Text> : null}
      {user ? (
        <Button
          loading={logout.loggingOut}
          onClick={() => void logout.signOut()}
          variant="secondary"
          fullWidth
        >
          {t("logout")}
        </Button>
      ) : null}
    </AuthPanel>
  );
}

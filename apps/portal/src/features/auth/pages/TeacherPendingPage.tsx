import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { AuthPanel } from "../components/AuthPanel";
import { useLogout } from "../hooks/useLogout";
import { useTeacherPending } from "../hooks/useTeacherPending";
import { TeacherPendingBody } from "../components/TeacherPendingBody";

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
  const application = useTeacherPending(user);
  const rejected = user?.applicationStatus === "rejected";
  return (
    <AuthPanel
      title={t("pending.title")}
      subtitle={t(rejected ? "pending.rejected" : "pending.body")}
    >
      <TeacherPendingBody
        registrationReceived={Boolean(state?.teacherRegistrationReceived)}
        rejected={rejected}
        {...(user?.rejectionReason ? { rejectionReason: user.rejectionReason } : {})}
        {...(application.profile ? { application: application.profile } : {})}
        {...(application.catalog ? { catalog: application.catalog } : {})}
        unavailable={Boolean(application.error)}
        onResubmit={application.refresh}
      />
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

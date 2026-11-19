import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import { AuthPanel } from "../components/AuthPanel";
import { useLogout } from "../hooks/useLogout";

/** Explains suspended account access and provides a logout action. */
export function AccountSuspendedPage() {
  const { t } = useTranslation("auth");
  const logout = useLogout();
  return (
    <AuthPanel title={t("suspended.title")} subtitle={t("suspended.body")}>
      <Button loading={logout.loggingOut} onClick={() => void logout.signOut()} fullWidth>
        {t("logout")}
      </Button>
    </AuthPanel>
  );
}

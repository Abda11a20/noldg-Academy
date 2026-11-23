import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Topbar } from "@noldg/ui";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface PortalFrameProps {
  children: ReactNode;
  userName?: string;
  roleLabel?: string;
  logoutLabel?: string;
  onLogout?: () => void;
  loggingOut?: boolean;
}

/** Renders the shared empty portal header and page region. */
export function PortalFrame({
  children,
  userName,
  roleLabel,
  logoutLabel,
  onLogout,
  loggingOut,
}: PortalFrameProps) {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Topbar
        languageSwitchSlot={<LanguageSwitcher />}
        logoAlt={t("logoAlt")}
        {...(userName ? { userName } : {})}
        {...(roleLabel ? { roleLabel } : {})}
        {...(logoutLabel ? { logoutLabel } : {})}
        {...(onLogout ? { onLogout } : {})}
        {...(loggingOut ? { loggingOut } : {})}
      />
      <main className="mx-auto w-full max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  );
}

import type { ReactNode } from "react";
import { Button } from "../button/Button";
import { Logo } from "../logo/Logo";

export interface TopbarProps {
  logoAlt: string;
  languageSwitchSlot?: ReactNode;
  userMenuSlot?: ReactNode;
  userName?: string;
  roleLabel?: string;
  logoutLabel?: string;
  mobileNavigationSlot?: ReactNode;
  onLogout?: () => void;
  loggingOut?: boolean;
}

/** Renders the shared portal header with injected language/user slots and optional logout. @param props Slots, labels, and logout event. */
export function Topbar({
  logoAlt,
  languageSwitchSlot,
  userMenuSlot,
  userName,
  roleLabel,
  logoutLabel,
  mobileNavigationSlot,
  onLogout,
  loggingOut = false,
}: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3">
      {mobileNavigationSlot}
      <Logo alt={logoAlt} className="w-32 sm:w-40" />
      <div className="ms-auto flex items-center gap-3">
        {userName ? (
          <span className="hidden text-sm text-foreground md:inline">{userName}</span>
        ) : null}
        {roleLabel ? (
          <span className="hidden text-sm text-foreground-muted md:inline">{roleLabel}</span>
        ) : null}
        {userMenuSlot ? <div className="md:hidden">{userMenuSlot}</div> : null}
        {onLogout && logoutLabel ? (
          <Button
            className="hidden md:inline-flex"
            loading={loggingOut}
            onClick={onLogout}
            size="sm"
            variant="ghost"
          >
            {logoutLabel}
          </Button>
        ) : null}
        <span className="hidden md:inline-flex">{languageSwitchSlot}</span>
      </div>
    </header>
  );
}

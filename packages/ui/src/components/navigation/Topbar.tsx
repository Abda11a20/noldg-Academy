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
  onLogout,
  loggingOut = false,
}: TopbarProps) {
  return (
    <header className="flex items-center gap-4 border-b border-border bg-surface px-4 py-3">
      <Logo alt={logoAlt} className="w-40" />
      <div className="ms-auto flex items-center gap-3">
        {userName ? <span className="text-sm text-foreground">{userName}</span> : null}
        {roleLabel ? <span className="text-sm text-foreground-muted">{roleLabel}</span> : null}
        {userMenuSlot}
        {onLogout && logoutLabel ? (
          <Button loading={loggingOut} onClick={onLogout} size="sm" variant="ghost">
            {logoutLabel}
          </Button>
        ) : null}
        {languageSwitchSlot}
      </div>
    </header>
  );
}

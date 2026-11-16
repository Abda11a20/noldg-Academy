import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "@noldg/ui";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface PortalFrameProps {
  children: ReactNode;
}

/** Renders the shared empty portal header and page region. */
export function PortalFrame({ children }: PortalFrameProps) {
  const { t } = useTranslation("common");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <Logo alt={t("logoAlt")} className="w-40" />
        <LanguageSwitcher />
      </header>
      <main className="mx-auto w-full max-w-screen-xl px-4 py-6">{children}</main>
    </div>
  );
}

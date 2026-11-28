import type { ReactNode } from "react";

export interface AppShellProps {
  topbar: ReactNode;
  sidebar: ReactNode;
  mobileNavigation: ReactNode;
  children: ReactNode;
}

/** Composes a responsive application shell from injected navigation and content slots.
 * @param props Topbar, desktop sidebar, mobile navigation, and page content.
 */
export function AppShell({ topbar, sidebar, mobileNavigation, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {topbar}
      <div className="mx-auto flex w-full max-w-screen-2xl">
        {sidebar ? (
          <aside className="hidden w-64 shrink-0 border-e border-border md:block">{sidebar}</aside>
        ) : null}
        <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
      </div>
      {mobileNavigation}
    </div>
  );
}

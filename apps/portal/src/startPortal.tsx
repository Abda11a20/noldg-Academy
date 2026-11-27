import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { apiMode } from "@noldg/api/mocks/mode";
import { AUTH_LOGOUT_EVENT } from "@noldg/api/auth/events";
import { Providers } from "./app/Providers";
import { router } from "./app/router";
import { clearAuthSession } from "./shared/auth/auth-store";
import { ROUTE_PATHS } from "./shared/navigation/routes";
import "./shared/i18n";
import "./shell.css";

/** Starts the portal after the small HTML entry has loaded. */
export async function startPortal(): Promise<void> {
  const mockWorkerEnabled = import.meta.env.DEV || import.meta.env.VITE_E2E_MOCKS === "true";
  if (mockWorkerEnabled && apiMode === "mock") {
    const { browserWorker } = await import("@noldg/api/mocks/browser");
    await browserWorker.start({ onUnhandledFrame: "error" });
  }
  window.addEventListener(AUTH_LOGOUT_EVENT, () => {
    clearAuthSession();
    const requestedPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const isLoginRoute = window.location.pathname === ROUTE_PATHS.login;
    const returnTo = isLoginRoute ? "" : `?returnTo=${encodeURIComponent(requestedPath)}`;
    void router.navigate(`${ROUTE_PATHS.login}${returnTo}`, { replace: true });
  });
  const root = document.getElementById("root");
  if (root)
    createRoot(root).render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
}

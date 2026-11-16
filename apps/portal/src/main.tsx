import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { apiMode } from "@noldg/api/mocks/mode";
import { Providers } from "./app/Providers";
import { router } from "./app/router";
import "./shared/i18n";
import "./shell.css";

const root = document.getElementById("root");

async function startPortal(): Promise<void> {
  if (import.meta.env.DEV && apiMode === "mock") {
    const { browserWorker } = await import("@noldg/api/mocks/browser");
    await browserWorker.start();
  }
  if (root)
    createRoot(root).render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
}

void startPortal();

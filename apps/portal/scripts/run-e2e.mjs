import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { access, readFile, rm } from "node:fs/promises";
import { createConnection } from "node:net";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { setTimeout as wait } from "node:timers/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  E2E_BASE_URL,
  E2E_HOST,
  E2E_POLL_INTERVAL_MS,
  E2E_PLAYWRIGHT_TIMEOUT_MS,
  E2E_PORT,
  E2E_READY_TIMEOUT_MS,
  PROCESS_TERMINATION_GRACE_MS,
} from "./e2e-constants.mjs";

const PORTAL_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST_DIRECTORY = resolve(PORTAL_DIRECTORY, "dist");
const VITE_CLI = resolve(PORTAL_DIRECTORY, "node_modules/vite/bin/vite.js");
const PLAYWRIGHT_CLI = resolve(PORTAL_DIRECTORY, "node_modules/@playwright/test/cli.js");
const HEADER_GENERATOR = resolve(PORTAL_DIRECTORY, "scripts/generate-headers.mjs");
const E2E_REPORT = resolve(PORTAL_DIRECTORY, "test-results/e2e-results.json");
const PROCESS_EXIT_GRACE_MS = 1500;
const executeFile = promisify(execFile);
const INTERRUPTED_EXIT_CODE = 130;
const GENERAL_FAILURE_EXIT_CODE = 1;

function isPortReady() {
  return new Promise((resolveReady) => {
    const socket = createConnection({ host: E2E_HOST, port: E2E_PORT });
    socket.once("connect", () => {
      socket.destroy();
      resolveReady(true);
    });
    socket.once("error", () => resolveReady(false));
  });
}

async function waitForPreview(preview, previewExit) {
  const deadline = Date.now() + E2E_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (preview.exitCode !== null) {
      const result = await previewExit;
      throw new Error(`Vite preview exited before readiness (${result.code ?? result.signal}).`);
    }
    if (await isPortReady()) return;
    await wait(E2E_POLL_INTERVAL_MS);
  }
  throw new Error(`Vite preview did not listen on ${E2E_HOST}:${E2E_PORT} in time.`);
}

function startPreview() {
  const preview = spawn(
    process.execPath,
    [VITE_CLI, "preview", "--host", E2E_HOST, "--port", String(E2E_PORT), "--strictPort"],
    {
      cwd: PORTAL_DIRECTORY,
      stdio: "inherit",
      windowsHide: true,
      detached: process.platform !== "win32",
    },
  );
  return { process: preview, exit: once(preview, "exit") };
}

async function runCommand(command, args, environment) {
  const child = spawn(command, args, {
    cwd: PORTAL_DIRECTORY,
    env: environment,
    stdio: "inherit",
    windowsHide: true,
  });
  const [code, signal] = await once(child, "exit");
  if (code !== 0) throw new Error(`${command} exited with ${code ?? signal}.`);
}

async function prepareE2EBuild() {
  const environment = {
    ...process.env,
    VITE_API_ORIGIN: process.env.VITE_API_ORIGIN ?? "https://api.example.invalid",
    VITE_INCLUDE_UI_GALLERY: "true",
  };
  await runCommand(process.execPath, [VITE_CLI, "build"], environment);
  await runCommand(process.execPath, [HEADER_GENERATOR], environment);
}

async function readPlaywrightExitCode() {
  const report = JSON.parse(await readFile(E2E_REPORT, "utf8"));
  return report.stats?.unexpected > 0 ? GENERAL_FAILURE_EXIT_CODE : 0;
}

async function killProcessTree(child) {
  if (child.exitCode !== null) return;
  if (process.platform === "win32") {
    try {
      await executeFile("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        windowsHide: true,
      });
    } catch {
      if (child.exitCode === null) child.kill();
    }
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (child.exitCode === null) throw error;
  }
}

async function waitForProcessExit(child, exit) {
  await Promise.race([exit, wait(PROCESS_TERMINATION_GRACE_MS)]);
  if (child.exitCode === null) child.unref();
}

async function runPlaywright() {
  await rm(E2E_REPORT, { force: true });
  const startedAt = Date.now();
  const runner = spawn(process.execPath, [PLAYWRIGHT_CLI, "test"], {
    cwd: PORTAL_DIRECTORY,
    env: { ...process.env, PORTAL_E2E_BASE_URL: E2E_BASE_URL },
    stdio: "inherit",
    windowsHide: true,
    detached: process.platform !== "win32",
  });
  const exited = once(runner, "exit").then(([code, signal]) => ({ code, signal }));
  const outcome = await Promise.race([
    exited.then((result) => ({ type: "exit", result })),
    (async () => {
      while (true) {
        if (Date.now() >= startedAt + E2E_PLAYWRIGHT_TIMEOUT_MS) {
          return { type: "timeout" };
        }
        try {
          await access(E2E_REPORT);
          await wait(PROCESS_EXIT_GRACE_MS);
          return { type: "report" };
        } catch {
          if (runner.exitCode !== null) return { type: "exit", result: await exited };
          await wait(E2E_POLL_INTERVAL_MS);
        }
      }
    })(),
  ]);
  if (outcome.type === "exit") {
    return (
      outcome.result.code ??
      (outcome.result.signal === "SIGINT" ? INTERRUPTED_EXIT_CODE : GENERAL_FAILURE_EXIT_CODE)
    );
  }

  if (outcome.type === "timeout") {
    await killProcessTree(runner);
    await waitForProcessExit(runner, exited);
    process.stderr.write("Playwright exceeded its 10-minute timeout.\n");
    return GENERAL_FAILURE_EXIT_CODE;
  }

  const exitCode = await readPlaywrightExitCode();
  await killProcessTree(runner);
  await waitForProcessExit(runner, exited);
  return exitCode;
}

async function stopPreview(preview) {
  if (preview.exitCode !== null) return;
  if (process.platform === "win32") {
    try {
      await executeFile("taskkill", ["/PID", String(preview.pid), "/T", "/F"], {
        windowsHide: true,
      });
    } catch {
      if (preview.exitCode === null) preview.kill();
    }
    return;
  }
  try {
    process.kill(-preview.pid, "SIGTERM");
  } catch (error) {
    if (preview.exitCode === null) throw error;
  }
}

async function main() {
  await access(DIST_DIRECTORY);
  await access(VITE_CLI);
  await access(PLAYWRIGHT_CLI);
  await prepareE2EBuild();

  const preview = startPreview();
  try {
    await waitForPreview(preview.process, preview.exit);
    process.exitCode = await runPlaywright();
  } finally {
    try {
      await stopPreview(preview.process);
    } finally {
      await waitForProcessExit(preview.process, preview.exit);
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : "E2E runner failed."}\n`);
  process.exitCode = GENERAL_FAILURE_EXIT_CODE;
});

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { switchLanguage } from "./language";

const screenshots = resolve(process.cwd(), "../../docs/reports/screenshots");
const VIDEO_FRAME_INTERVAL_MS = 100;
const VIDEO_RECORDING_DURATION_MS = 1_000;
mkdirSync(screenshots, { recursive: true });

async function signInStudent(page: Page) {
  await page.goto("/login");
  await switchLanguage(page, "ar");
  await page.getByLabel("Email address").fill("student@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student$/u);
}

async function openMyLessons(page: Page) {
  await page.evaluate(() => {
    window.history.pushState({}, "", "/student/lessons");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "My lessons" })).toBeVisible();
}

async function createTinyVideo(page: Page): Promise<Buffer> {
  const data = await page.evaluate(
    async ({ frameIntervalMs, recordingDurationMs }) => {
      if (
        typeof MediaRecorder === "undefined" ||
        typeof HTMLCanvasElement.prototype.captureStream !== "function"
      ) {
        throw new Error("This browser cannot create the tiny WebM test video.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 16;
      canvas.height = 16;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("The browser cannot draw the tiny WebM test video.");
      context.fillRect(0, 0, canvas.width, canvas.height);
      const stream = canvas.captureStream(10);
      const recorder = new MediaRecorder(stream);
      const recorded = new Promise<number[]>((resolve) => {
        const chunks: BlobPart[] = [];
        recorder.addEventListener("dataavailable", (event) => chunks.push(event.data));
        recorder.addEventListener(
          "stop",
          async () => {
            const bytes = new Uint8Array(
              await new Blob(chunks, { type: recorder.mimeType }).arrayBuffer(),
            );
            resolve(Array.from(bytes));
          },
          { once: true },
        );
      });
      recorder.start();
      const drawInterval = window.setInterval(() => {
        context.fillRect(0, 0, canvas.width, canvas.height);
      }, frameIntervalMs);
      await new Promise<void>((resolve) => window.setTimeout(resolve, recordingDurationMs));
      window.clearInterval(drawInterval);
      recorder.stop();
      const bytes = await recorded;
      stream.getTracks().forEach((track) => track.stop());
      return bytes;
    },
    {
      frameIntervalMs: VIDEO_FRAME_INTERVAL_MS,
      recordingDurationMs: VIDEO_RECORDING_DURATION_MS,
    },
  );
  return Buffer.from(data);
}

test("student opens My lessons and starts the server-authorized file player", async ({
  page,
  declareExpectedApiFailure,
}) => {
  declareExpectedApiFailure({
    method: "GET",
    urlPattern: /^https:\/\/media\.example\.test\/notes\.pdf$/u,
    status: "network",
    failure: "net::ERR_ABORTED",
    required: false,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  const video = await createTinyVideo(page);
  await signInStudent(page);
  await openMyLessons(page);
  await expect(page.getByRole("heading", { name: "My lessons" })).toBeVisible();
  await expect(page.getByText("Available now").first()).toBeVisible();
  await page.screenshot({ path: resolve(screenshots, "f7-en-375-my-lessons.png"), fullPage: true });
  await page.getByRole("link", { name: "Introduction to algebra" }).click();
  await expect(page.getByRole("heading", { name: "Introduction to algebra" })).toBeVisible();
  await page.getByRole("button", { name: "Start lesson" }).click();
  const videoElement = page.locator('video[aria-label="Play video"]');
  await expect(videoElement).toBeVisible();
  await videoElement.evaluate(
    (element, bytes) => {
      const media = element as HTMLVideoElement;
      media.src = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "video/webm" }));
      media.load();
    },
    [...video],
  );
  await expect(page.getByRole("slider", { name: "Seek video" })).toBeVisible();
  await videoElement.evaluate((element) => {
    (element as HTMLVideoElement).loop = true;
  });
  await expect
    .poll(() => videoElement.evaluate((element) => (element as HTMLVideoElement).readyState))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Play video" }).click();
  const heartbeatResponse = page.waitForResponse(
    (response) => response.url().includes("/playback/") && response.url().endsWith("/heartbeat"),
  );
  await page.evaluate(() => {
    const media = document.querySelector("video");
    if (!media) throw new Error("Expected the lesson video element.");
    Object.defineProperty(media, "currentTime", { configurable: true, value: 80 });
    media.dispatchEvent(new Event("play", { bubbles: true }));
    media.dispatchEvent(new Event("timeupdate", { bubbles: true }));
  });
  await heartbeatResponse;
  await expect(page.getByRole("link", { name: "Open quiz" })).toBeVisible();
  await expect(page.getByText("This video uses a direct download link")).toHaveCount(0);
  await page.screenshot({
    path: resolve(screenshots, "f7-en-375-lesson-player.png"),
    fullPage: true,
  });
  await page.route("https://media.example.test/notes.pdf", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/pdf",
      headers: { "content-disposition": "attachment; filename=notes.pdf" },
      body: "%PDF-1.4\n%%EOF",
    }),
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Algebra notes.pdf" }).click();
  expect((await download).suggestedFilename()).toBe("notes.pdf");
});

test("lesson availability filters follow the URL and switch the shell direction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signInStudent(page);
  await page.getByRole("link", { name: "My lessons" }).click();
  await page.getByRole("button", { name: "Upcoming" }).click();
  await expect
    .poll(() => page.evaluate(() => new URLSearchParams(location.search).get("filters")))
    .toContain("upcoming");
  await expect(page.getByRole("link", { name: "Quadratic equations" })).toBeVisible();
  await switchLanguage(page, "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: resolve(screenshots, "f7-ar-1280-my-lessons.png"),
    fullPage: true,
  });
  await switchLanguage(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await page.screenshot({
    path: resolve(screenshots, "f7-en-1280-my-lessons.png"),
    fullPage: true,
  });
});

test("a replacement session announces the device change and can continue here", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/playback\/session-replaced-first\/heartbeat$/u,
    status: 409,
  });
  await signInStudent(page);
  await openMyLessons(page);
  await page.getByRole("link", { name: "Introduction to algebra" }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/student/lessons/lesson-session-replaced");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "Introduction to algebra" })).toBeVisible();
  await page.getByRole("button", { name: "Start lesson" }).click();
  const video = page.locator('video[aria-label="Play video"]');
  await expect(video).toBeVisible();
  await video.dispatchEvent("play");
  await expect(page.getByText("Playback moved to another device")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Continue here" }).click();
  await expect(video).toBeVisible();
});

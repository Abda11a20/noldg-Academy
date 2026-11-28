import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { switchLanguage } from "./language";

const SCREENSHOTS = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(SCREENSHOTS, { recursive: true });

async function signInApprovedTeacher(page: Page) {
  await page.goto("/login");
  await switchLanguage(page, "ar");
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
}

test("approved teacher can publish a video lesson and create a bundle", async ({
  page,
  declareExpectedApiFailure,
}) => {
  declareExpectedApiFailure({
    method: "GET",
    urlPattern: /\/api\/(?:products\/my|lessons\/courses\/course-general-secondary-1)(?:\?.*)?$/u,
    status: "network",
    failure: "net::ERR_ABORTED",
    required: false,
  });
  await signInApprovedTeacher(page);
  await expect(page.getByRole("heading", { name: "My courses" })).toBeVisible();
  const courseResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/lessons/courses/course-general-secondary-1") &&
      response.status() === 200,
  );
  const productsResponse = page.waitForResponse(
    (response) => response.url().includes("/api/products/my") && response.status() === 200,
  );
  await page.getByRole("link", { name: "Open course" }).click();
  await Promise.all([courseResponse, productsResponse]);
  await page.getByRole("button", { name: "Create lesson" }).click();
  await page.getByLabel("Title").fill("F4 uploaded lesson");
  await page
    .getByLabel("Description")
    .fill("A recorded lesson uploaded through the signed provider ticket.");
  await page.getByLabel("Available from").fill("2027-02-01T10:00");
  await page.getByLabel("Available until").fill("2027-03-01T10:00");
  await page.getByRole("radio", { name: "Paid" }).click();
  await page.getByLabel("Price in EGP").fill("150");
  await page.locator('input[accept="video/mp4,video/webm,video/quicktime"]').setInputFiles({
    name: "lesson.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("mock video"),
  });
  await page.getByRole("button", { name: "Upload video" }).click();
  await expect(page.getByText(/MB · Processing/)).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1\/lessons\/lesson-/);
  await expect(page.getByText("Ready")).toBeVisible();
  await page.getByRole("button", { name: "Publish lesson" }).click();
  const lessonsRefresh = page.waitForResponse(
    (response) =>
      response.url().includes("/api/lessons/courses/course-general-secondary-1") &&
      response.status() === 200,
  );
  await page.getByRole("link", { name: "Lessons" }).click();
  await lessonsRefresh;
  await expect(page.getByText("F4 uploaded lesson").first()).toBeVisible();
  declareExpectedApiFailure({
    method: "GET",
    urlPattern: /\/api\/products\/[^/]+\/pricing$/u,
    status: 409,
  });
  const bundlesProducts = page.waitForResponse(
    (response) => response.url().endsWith("/api/products/my") && response.status() === 200,
  );
  await page.getByRole("tab", { name: "Bundles" }).click();
  await bundlesProducts;
  await page.getByRole("button", { name: "Create bundle" }).click();
  await page.getByLabel("Bundle name").fill("F4 lesson bundle");
  await page.getByLabel("Bundle price in EGP").fill("240");
  await page.getByLabel("Announced lesson count").fill("1");
  await page.getByLabel("F4 uploaded lesson").check();
  const productsRefresh = page.waitForResponse(
    (response) => response.url().endsWith("/api/products/my") && response.status() === 200,
  );
  const pricingRefresh = page.waitForResponse(
    (response) =>
      /\/api\/products\/[^/]+\/pricing$/u.test(response.url()) && response.status() === 200,
  );
  await page.getByRole("button", { name: "Save bundle" }).click();
  await Promise.all([productsRefresh, pricingRefresh]);
  await expect(page.getByRole("cell", { name: "F4 lesson bundle" })).toBeVisible();
  await expect(page.getByText(/EGP.*240/).first()).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f4-teacher-bundles-en-1280.png"),
    fullPage: true,
  });
});

test("teacher course views render in Arabic RTL at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await switchLanguage(page, "ar");
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  await switchLanguage(page, "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("link", { name: "فتح الكورس" }).click();
  await expect(page.getByRole("tab", { name: "الحصص" })).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f4-teacher-courses-ar-375.png"),
    fullPage: true,
  });
});

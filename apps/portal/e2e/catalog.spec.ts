import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const SCREENSHOTS = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(SCREENSHOTS, { recursive: true });

async function signInApprovedTeacher(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
}

test("approved teacher can publish a video lesson and create a bundle", async ({ page }) => {
  await signInApprovedTeacher(page);
  await expect(page.getByRole("heading", { name: "My courses" })).toBeVisible();
  await page.getByRole("link", { name: "Open course" }).click();
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
  await expect(page.getByText("Processing")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1\/lessons\/lesson-/);
  await expect(page.getByText("Ready")).toBeVisible();
  await page.getByRole("button", { name: "Publish lesson" }).click();
  await page.getByRole("link", { name: "Lessons" }).click();
  await expect(page.getByText("F4 uploaded lesson").first()).toBeVisible();
  await page.getByRole("tab", { name: "Bundles" }).click();
  await page.getByRole("button", { name: "Create bundle" }).click();
  await page.getByLabel("Bundle name").fill("F4 lesson bundle");
  await page.getByLabel("Bundle price in EGP").fill("240");
  await page.getByLabel("Announced lesson count").fill("1");
  await page.getByLabel("F4 uploaded lesson").check();
  await page.getByRole("button", { name: "Save bundle" }).click();
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
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  await page.getByRole("button", { name: "Change language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByRole("link", { name: "فتح الكورس" }).click();
  await expect(page.getByRole("tab", { name: "الحصص" })).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f4-teacher-courses-ar-375.png"),
    fullPage: true,
  });
});

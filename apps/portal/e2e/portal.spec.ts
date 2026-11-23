import { expect, test } from "./fixtures";
import { resolve } from "node:path";

test("portal loads and anonymous student routes redirect to login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("banner")).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/student");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fstudent$/);
});

test("language switch updates document language and direction", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("development gallery renders both directions", async ({ page }) => {
  await page.goto("/__ui");
  await expect(page.locator("section[dir='rtl']")).toBeVisible();
  await expect(page.locator("section[dir='ltr']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "معرض عناصر الواجهة" })).toBeVisible();
  await page.screenshot({
    path: resolve(process.cwd(), "../../docs/reports/f1a-gallery-ar-1280.png"),
    fullPage: true,
  });
});

test("development gallery covers Arabic and English at mobile and desktop widths", async ({
  page,
}) => {
  await page.goto("/__ui");
  const sizes = [
    { name: "375", width: 375, height: 812 },
    { name: "1280", width: 1280, height: 800 },
  ] as const;
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await expect(page.locator("section[dir='rtl']")).toBeVisible();
    await expect(page.locator("section[dir='ltr']")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /اختر مادة|Choose a subject/ }).first(),
    ).toBeVisible();
    await page.screenshot({
      path: resolve(process.cwd(), `../../docs/reports/f1a-gallery-ar-${size.name}.png`),
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await expect(page.getByRole("heading", { name: "Form components" }).first()).toBeVisible();
    await page.screenshot({
      path: resolve(process.cwd(), `../../docs/reports/f1a-gallery-en-${size.name}.png`),
      fullPage: true,
    });
  }
});

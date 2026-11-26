import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const screenshots = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(screenshots, { recursive: true });

async function navigateClient(page: Page, path: string) {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function signInStudent(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill("student@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student$/);
}

async function chooseLanguage(page: Page, language: "ar" | "en") {
  if ((await page.locator("html").getAttribute("lang")) !== language) {
    await page.getByRole("button", { name: /Change language|تغيير اللغة/ }).click();
  }
  await expect(page.locator("html")).toHaveAttribute("lang", language);
  await expect(page.locator("html")).toHaveAttribute("dir", language === "ar" ? "rtl" : "ltr");
}

async function applyBrowseFilters(page: Page, language: "ar" | "en", width: number) {
  const arabic = language === "ar";
  if (width === 375) {
    await page.getByRole("button", { name: arabic ? "التصفية" : "Filters" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  }
  await page.getByRole("combobox", { name: arabic ? "المادة" : "Subject" }).click();
  await page.getByRole("option", { name: arabic ? "الرياضيات" : "Mathematics" }).click();
  await page.getByRole("combobox", { name: arabic ? "أقل تقييم" : "Minimum rating" }).click();
  await page.getByRole("option", { name: /3.*(?:stars|نجوم)/iu }).click();
  await page.getByRole("combobox", { name: arabic ? "ترتيب حسب" : "Sort by" }).click();
  await page
    .getByRole("option", { name: arabic ? "السعر: من الأقل للأعلى" : "Price: low to high" })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const params = new URLSearchParams(window.location.search);
        return {
          sort: params.get("sort"),
          filters: JSON.parse(params.get("filters") ?? "{}") as Record<string, string>,
        };
      }),
    )
    .toMatchObject({
      sort: "priceAsc",
      filters: { subjectId: "subject-math", minRating: "3" },
    });
  if (width === 375) await page.keyboard.press("Escape");
}

async function browseAtSizeAndLanguage(page: Page, width: number, language: "ar" | "en") {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
  await chooseLanguage(page, language);
  await navigateClient(
    page,
    "/student/teachers?trackId=track-secondary-1&page=1&pageSize=12&q=Ahmed&sort=newest",
  );
  await applyBrowseFilters(page, language, width);
  const teacherName = language === "ar" ? "أحمد حسن" : "Ahmed Hassan";
  await page.getByRole("link", { name: teacherName }).waitFor();
  await page.screenshot({
    path: resolve(screenshots, `f5-${language}-${width}-teachers.png`),
    fullPage: true,
  });
  await page.getByRole("link", { name: teacherName }).click();
  await expect(page.getByRole("heading", { name: teacherName })).toBeVisible();
  await expect(page.getByRole("tablist")).toBeVisible();
  await page.screenshot({
    path: resolve(screenshots, `f5-${language}-${width}-teacher-detail.png`),
    fullPage: true,
  });
  const subscribeLabel = language === "ar" ? "متابعة" : "Continue";
  await page.getByRole("link", { name: subscribeLabel }).first().click();
  const checkoutText =
    language === "ar" ? "ستتوفر في الخطوة القادمة" : "Available in the next step";
  await expect(page.getByText(checkoutText)).toBeVisible();
  await page.goBack();
  const listLabel = language === "ar" ? "معلمو صفك الدراسي" : "Teachers for your track";
  await page.getByRole("link", { name: listLabel }).click();
  await expect
    .poll(() => page.evaluate(() => new URLSearchParams(window.location.search).get("q")))
    .toBe("Ahmed");
  await expect(page).toHaveURL(/sort=priceAsc/);
  await expect(page.getByRole("link", { name: teacherName })).toBeVisible();
}

test("student browses teacher list, details, checkout placeholder, and keeps URL filters", async ({
  page,
}) => {
  await page.route("https://res.cloudinary.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><circle cx=".5" cy=".5" r=".5"/></svg>',
    }),
  );
  await signInStudent(page);
  for (const viewport of [1280, 375]) {
    for (const language of ["en", "ar"] as const) {
      await browseAtSizeAndLanguage(page, viewport, language);
    }
  }
});

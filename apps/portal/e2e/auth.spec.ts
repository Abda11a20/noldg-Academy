import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const password = "Aa1!pass";
const screenshots = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(screenshots, { recursive: true });

async function switchToEnglish(page: Page) {
  await navigateClient(page, "/login");
  if ((await page.locator("html").getAttribute("lang")) !== "en") {
    await page.getByRole("button", { name: "تغيير اللغة" }).click();
  }
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expectAccessible(page);
}

async function navigateClient(page: Page, path: string) {
  if (page.url() === "about:blank") {
    await page.goto(path);
    return;
  }
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function enterOtp(page: Page) {
  const digits = ["1", "2", "3", "4", "5", "6"];
  for (const [index, digit] of digits.entries()) {
    await page.getByRole("textbox", { name: "Code digit " + (index + 1) }).fill(digit);
  }
}

async function expectAccessible(page: Page) {
  const jestAxePath = createRequire(import.meta.url).resolve("jest-axe");
  const axeScriptPath = createRequire(jestAxePath).resolve("axe-core/axe.min.js");
  await page.addScriptTag({ path: axeScriptPath });
  const violations = await page.evaluate(async () => {
    interface AxeWindow extends Window {
      axe: {
        run: () => Promise<{
          violations: Array<{ id: string; nodes: Array<{ failureSummary?: string }> }>;
        }>;
      };
    }
    const result = await (window as AxeWindow).axe.run();
    return result.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((node) => node.failureSummary ?? ""),
    }));
  });
  expect(violations).toEqual([]);
}

test("student signup, email verification, and login", async ({ page }) => {
  await switchToEnglish(page);
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-register.png"), fullPage: true });
  await page.getByRole("link", { name: "Join as a student" }).click();
  await page.getByLabel("Full name").fill("Mona Ali");
  await page.getByLabel("Email address").fill("f2-student@example.test");
  await page.getByLabel("Mobile number", { exact: true }).fill("+201111111111");
  await page.getByLabel("Parent or guardian mobile number").fill("+201000000001");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("combobox", { name: "Education system" }).click();
  await page.getByRole("option", { name: "General education" }).click();
  await page.getByRole("combobox", { name: "Grade" }).click();
  await page.getByRole("option", { name: "First Secondary" }).click();
  await page.getByLabel("I accept the terms and conditions").check();
  await page.screenshot({ path: resolve(screenshots, "f2-register-student.png"), fullPage: true });
  await expectAccessible(page);
  await page.getByRole("button", { name: "Create student account" }).click();
  await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-verify-email.png"), fullPage: true });
  await enterOtp(page);
  await page.getByRole("button", { name: "Verify email" }).click();
  await page.getByLabel("Email address").fill("f2-student@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student$/);
  await expect(page.getByRole("heading", { name: "Welcome, New Student" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-student.png"), fullPage: true });
});

test("teacher registration adds offerings and reaches pending review", async ({ page }) => {
  await switchToEnglish(page);
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByRole("link", { name: "Apply as a teacher" }).click();
  await page.getByLabel("Full name").fill("Salma Teacher");
  await page.getByLabel("Email address").fill("f2-teacher@example.test");
  await page.getByLabel("Mobile number").fill("+201000000010");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.locator("input[type=file]").setInputFiles({
    name: "teacher.png",
    mimeType: "image/png",
    buffer: Buffer.from("teacher-image"),
  });
  await page.getByLabel("Teaching experience").fill("I teach mathematics.");
  await page.getByRole("combobox", { name: "Education system" }).click();
  await page.getByRole("option", { name: "General education" }).click();
  await page.getByLabel("First Secondary").check();
  await page.getByLabel("Mathematics").check();
  await page.getByRole("button", { name: "Add selected subjects" }).click();
  await page.getByLabel("I accept the terms and conditions").check();
  await page.screenshot({ path: resolve(screenshots, "f2-register-teacher.png"), fullPage: true });
  await expectAccessible(page);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText("Application received")).toBeVisible();
  await enterOtp(page);
  await page.getByRole("button", { name: "Verify email" }).click();
  await page.getByLabel("Email address").fill("f2-teacher@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher\/pending$/);
  await expect(page.getByRole("heading", { name: "Teacher application review" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-teacher-pending.png"), fullPage: true });
});

test("student, teacher, and admin login redirects by role", async ({ page }) => {
  const accounts = [
    { email: "student@example.test", path: "/student", role: "Student" },
    { email: "teacher-approved@example.test", path: "/teacher", role: "Teacher" },
    { email: "teacher-pending@example.test", path: "/teacher/pending", role: "Teacher" },
    { email: "admin@example.test", path: "/admin", role: "Administrator" },
  ];
  for (const account of accounts) {
    await switchToEnglish(page);
    await page.getByLabel("Email address").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(account.path);
    if (account.role === "Teacher") {
      if (account.path === "/teacher/pending") {
        await expect(
          page.getByRole("heading", { name: "Teacher application review" }),
        ).toBeVisible();
        await expectAccessible(page);
      } else {
        await expect(page.getByRole("heading", { name: "My courses" })).toBeVisible();
        await expectAccessible(page);
        await page.screenshot({ path: resolve(screenshots, "f2-teacher.png"), fullPage: true });
      }
    } else {
      await expect(page.getByRole("heading", { name: /Welcome|Signed in as/ })).toBeVisible();
      await expectAccessible(page);
      if (account.role === "Administrator") {
        await page.screenshot({ path: resolve(screenshots, "f2-admin.png"), fullPage: true });
      }
    }
  }
  await switchToEnglish(page);
  await page.getByLabel("Email address").fill("teacher-rejected@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher\/pending$/);
  await expect(page.getByText("Please add more teaching experience.")).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-teacher-rejected.png"), fullPage: true });
});

test("wrong password remains generic, forgot and reset password never put a code in the URL", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await switchToEnglish(page);
  await page.getByLabel("Email address").fill("wrong-password@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/auth\/login$/u,
    status: 401,
  });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("The email or password is incorrect.")).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-login-error.png"), fullPage: true });
  await page.getByRole("link", { name: "Forgot your password?" }).click();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-forgot-password.png"), fullPage: true });
  await page.getByLabel("Email address").fill("student@example.test");
  await page.getByRole("button", { name: "Send recovery code" }).click();
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-reset-password.png"), fullPage: true });
  await enterOtp(page);
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password").fill(password);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Your password has been reset.")).toBeVisible();
  await expect(page).not.toHaveURL(/123456/);
});

test("guard preserves returnTo, logout clears session, and device-change request shows status", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await switchToEnglish(page);
  await navigateClient(page, "/student?tab=lessons");
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fstudent%3Ftab%3Dlessons$/);
  await page.getByLabel("Email address").fill("student@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student\?tab=lessons$/);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login(?:\?returnTo=.*)?$/);
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/auth\/login$/u,
    status: 403,
  });
  declareExpectedApiFailure({
    method: "GET",
    urlPattern: /\/api\/devices\/change-requests\/me$/u,
    status: 404,
  });
  await page.getByLabel("Email address").fill("device-blocked@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "This account is linked to another device" }),
  ).toBeVisible();
  await page.getByLabel("Reason (optional)").fill("I changed my phone.");
  await page.getByRole("button", { name: "Request a device change" }).click();
  await expect(page.getByText("Your device change request is waiting for review.")).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-device-blocked.png"), fullPage: true });
});

test("suspended account login routes to the suspended state", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await switchToEnglish(page);
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/auth\/login$/u,
    status: 403,
  });
  await page.getByLabel("Email address").fill("suspended@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Account suspended" })).toBeVisible();
  await expectAccessible(page);
  await page.screenshot({ path: resolve(screenshots, "f2-account-suspended.png"), fullPage: true });
});

test("expired session redirects to login after a failed refresh", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await switchToEnglish(page);
  await page.getByLabel("Email address").fill("expired-session@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/student$/);
  await navigateClient(page, "/device-blocked");
  declareExpectedApiFailure({
    method: "GET",
    urlPattern: /\/api\/devices\/change-requests\/me$/u,
    status: 404,
  });
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/auth\/refresh$/u,
    status: 401,
  });
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/devices\/change-requests$/u,
    status: 401,
  });
  await page.getByRole("button", { name: "Request a device change" }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fdevice-blocked$/);
});

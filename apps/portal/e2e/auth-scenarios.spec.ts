import { AUTH_OTP_SCENARIOS, AUTH_SCENARIO_EMAILS } from "@noldg/api/mocks/fixtures/auth";
import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const PASSWORD = "Aa1!pass";

async function switchToEnglish(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
}

async function fillStudentRegistration(
  page: Page,
  email: string,
  phone = "+201111111111",
): Promise<void> {
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByRole("link", { name: "Join as a student" }).click();
  await expect(page.getByRole("heading", { name: "Student registration" })).toBeVisible();
  await page.getByLabel("Full name").fill("Mona Ali");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Mobile number", { exact: true }).fill(phone);
  await page.getByLabel("Parent or guardian mobile number").fill("+201111111112");
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("combobox", { name: "Education system" }).click();
  await page.getByRole("option", { name: "General education" }).click();
  await page.getByRole("combobox", { name: "Grade" }).click();
  await page.getByRole("option", { name: "First Secondary" }).click();
  await page.getByLabel("I accept the terms and conditions").check();
}

async function enterCode(page: Page, code: string): Promise<void> {
  for (const [index, digit] of [...code].entries()) {
    await page.getByRole("textbox", { name: `Code digit ${index + 1}` }).fill(digit);
  }
}

const LOGIN_SCENARIOS = [
  {
    name: "wrong password",
    email: AUTH_SCENARIO_EMAILS.wrongPassword,
    message: "The email or password is incorrect.",
    route: "/login",
  },
  {
    name: "pending teacher",
    email: AUTH_SCENARIO_EMAILS.teacher,
    message: "Your application is waiting for approval.",
    route: "/teacher/pending",
  },
  {
    name: "rejected teacher",
    email: AUTH_SCENARIO_EMAILS.rejectedTeacher,
    message: "Please add more teaching experience.",
    route: "/teacher/pending",
  },
  {
    name: "suspended account",
    email: AUTH_SCENARIO_EMAILS.suspended,
    message: "This account is suspended. Contact support for help.",
    route: "/account-suspended",
  },
  {
    name: "device not registered",
    email: AUTH_SCENARIO_EMAILS.deviceBlocked,
    message:
      "Your account is linked to another device. You can request a device change or sign out.",
    route: "/device-blocked",
  },
  {
    name: "429 response",
    email: AUTH_SCENARIO_EMAILS.rateLimited,
    message: "Too many attempts. Wait 30 seconds and try again.",
    route: "/login",
  },
  {
    name: "network failure",
    email: AUTH_SCENARIO_EMAILS.networkFailure,
    message: "The request could not be completed. Try again.",
    route: "/login",
  },
] as const;

for (const scenario of LOGIN_SCENARIOS) {
  test(`auth page handles ${scenario.name}`, async ({ page }) => {
    await switchToEnglish(page);
    await page.getByLabel("Email address").fill(scenario.email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(new RegExp(`${scenario.route.replaceAll("/", "\\/")}$`));
    await expect(page.getByText(scenario.message)).toBeVisible();
    if (scenario.name === "429 response") {
      await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
    }
  });
}

const REGISTRATION_SCENARIOS = [
  {
    name: "email already taken",
    email: AUTH_SCENARIO_EMAILS.emailTaken,
    phone: "+201111111113",
    message: "An account already uses this email address.",
  },
  {
    name: "phone already taken",
    email: "new-student@example.test",
    phone: AUTH_SCENARIO_EMAILS.phoneTaken,
    message: "An account already uses this phone number.",
  },
  {
    name: "validation details",
    email: AUTH_SCENARIO_EMAILS.validationError,
    phone: "+201111111114",
    message: "Check the information and try again.",
  },
] as const;

for (const scenario of REGISTRATION_SCENARIOS) {
  test(`student registration handles ${scenario.name}`, async ({ page }) => {
    await switchToEnglish(page);
    await fillStudentRegistration(page, scenario.email, scenario.phone);
    await page.getByRole("button", { name: "Create student account" }).click();
    await expect(page.getByText(scenario.message)).toBeVisible();
    if (scenario.name === "validation details") {
      await expect(page.locator("#student-email")).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("#student-phone")).toHaveAttribute("aria-invalid", "true");
    }
  });
}

const OTP_SCENARIOS = [
  {
    name: "invalid code",
    code: AUTH_OTP_SCENARIOS.invalid,
    message: "The code is incorrect.",
  },
  {
    name: "expired code",
    code: AUTH_OTP_SCENARIOS.expired,
    message: "The code has expired. Request a new one.",
  },
  {
    name: "rate limited code",
    code: AUTH_OTP_SCENARIOS.rateLimited,
    message: "Too many code attempts. Wait before trying again.",
  },
] as const;

for (const scenario of OTP_SCENARIOS) {
  test(`email verification handles ${scenario.name}`, async ({ page }) => {
    await switchToEnglish(page);
    await fillStudentRegistration(page, `otp-${scenario.name.replaceAll(" ", "-")}@example.test`);
    await page.getByRole("button", { name: "Create student account" }).click();
    await expect(page).toHaveURL(/\/verify-email$/);
    await enterCode(page, scenario.code);
    await page.getByRole("button", { name: "Verify email" }).click();
    await expect(page.getByText(scenario.message)).toBeVisible();
  });
}

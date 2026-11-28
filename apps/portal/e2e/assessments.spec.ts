import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { switchLanguage } from "./language";

const SCREENSHOTS = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(SCREENSHOTS, { recursive: true });

async function signInApprovedTeacher(page: Page): Promise<void> {
  await page.goto("/login");
  await switchLanguage(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/u);
}

test("teacher creates a question and exam, reviews results, and publishes a lesson quiz", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await signInApprovedTeacher(page);
  await page.getByRole("link", { name: "Question bank" }).click();
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(
    page.getByText("Check the question text, options, and correct answer."),
  ).toBeVisible();
  await page.getByLabel("Question text").fill("F8 assessment question?");
  await page.getByLabel("Option 1", { exact: true }).fill("First answer");
  await page.getByLabel("Option 2", { exact: true }).fill("Second answer");
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Question added.", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "My courses" }).click();
  await page.getByRole("link", { name: "Open course" }).click();
  await page.getByRole("tab", { name: "Exams and homework" }).click();
  await page.getByRole("button", { name: "Create exam" }).click();
  await page.getByLabel("Title").fill("F8 E2E exam");
  await page.getByLabel("Opens at").fill("2027-02-01T10:00");
  await page.getByLabel("Closes at").fill("2027-02-01T12:00");
  await page.getByLabel("F8 assessment question?").check();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1$/u);

  await page.getByRole("tab", { name: "Exams and homework" }).click();
  await page.getByRole("button", { name: "Results" }).first().click();
  await expect(page.getByRole("heading", { name: "Assessment results" })).toBeVisible();
  await page.getByRole("link", { name: "View attempt" }).nth(1).click();
  await expect(page.getByText("Correct answer")).toBeVisible();

  await page.getByRole("link", { name: "Course", exact: true }).click();
  await page.getByRole("tab", { name: "Lessons" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page.locator("#lesson-title").waitFor();
  await page.locator("#lesson-quiz-title").fill("F8 lesson quiz");
  await page.getByLabel("F8 assessment question?").check();
  await page.getByRole("button", { name: "Create and publish quiz" }).click();
  await expect(page.getByText(/already has a Published quiz/u)).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f8-assessment-lesson-quiz-en-1280.png"),
    fullPage: true,
  });
});

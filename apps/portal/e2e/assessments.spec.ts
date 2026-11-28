import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { switchLanguage } from "./language";

const SCREENSHOTS = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(SCREENSHOTS, { recursive: true });

async function signInApprovedTeacherEn(page: Page): Promise<void> {
  await page.goto("/login");
  await switchLanguage(page, "ar");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Email address").fill("teacher-approved@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/u);
}

async function createMcq(
  page: Page,
  text: string,
  firstOption: string,
  secondOption: string,
): Promise<void> {
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByLabel("Question text").fill(text);
  await page.getByLabel("Option 1", { exact: true }).fill(firstOption);
  await page.getByLabel("Option 2", { exact: true }).fill(secondOption);
  await expect(page.getByText("Student live preview")).toBeVisible();
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Question added.", { exact: true }).first()).toBeVisible();
}

async function authorTargetedExamAndDuplicate(page: Page): Promise<void> {
  await page.getByRole("link", { name: "My courses" }).click();
  await page.getByRole("link", { name: "Open course" }).click();
  await page.getByRole("tab", { name: "Exams" }).click();
  await page.getByRole("button", { name: "Create exam" }).click();

  await page.getByLabel("Title").fill("F8 E2E exam");
  await page.getByLabel("Opens at").fill("2027-02-01T10:00");
  await page.getByLabel("Closes at").fill("2027-02-01T12:00");
  await page.getByLabel("Duration in minutes").fill("60");
  await page.getByLabel("Random questions per attempt (optional)").fill("1");
  await page.getByLabel("Selected students").click();
  await page.getByLabel("مريم حسن").check();
  await page.getByLabel("Omar Ali").check();
  await page.getByLabel("F8 E2E question one?").check();
  await page.getByLabel("F8 E2E question two?").check();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f8a-en-1280-builder.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1$/u);

  await page.getByRole("tab", { name: "Exams" }).click();
  await expect(page.getByText("F8 E2E exam").first()).toBeVisible();
  await page.getByRole("button", { name: "Duplicate" }).first().click();
  await expect(page).toHaveURL(
    /\/teacher\/courses\/course-general-secondary-1\/assessments\/.+\/edit$/u,
  );
  await page.getByLabel("مريم حسن").uncheck();
  await page.getByRole("button", { name: "Save and publish" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1$/u);
}

async function authorHomeworkQuizAndReviewResults(page: Page): Promise<void> {
  await page.getByRole("tab", { name: "Homework" }).click();
  await page.getByRole("button", { name: "Create homework" }).click();
  await page.getByLabel("Title").fill("F8 E2E homework");
  await page.getByLabel("Opening day").fill("2027-02-05");
  await page.getByLabel("Closing day").fill("2027-02-10");
  await page.getByLabel("F8 E2E question one?").check();
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/teacher\/courses\/course-general-secondary-1$/u);

  await page.getByRole("tab", { name: "Lessons" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page.locator("#lesson-title").waitFor();
  await page.locator("#lesson-quiz-title").fill("F8 E2E lesson quiz");
  await page.locator("#lesson-quiz-watch-percent").fill("80");
  await page.getByLabel("F8 E2E question one?").check();
  await page.getByRole("button", { name: "Create and publish quiz" }).click();
  await expect(page.getByText(/already has a Published quiz/u)).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f8a-en-1280-lesson-quiz.png"),
    fullPage: true,
  });

  await page.getByRole("link", { name: "Lessons", exact: true }).click();
  await page.getByRole("tab", { name: "Exams" }).click();
  await page.getByRole("button", { name: "Results" }).first().click();
  await expect(page.getByRole("heading", { name: "Assessment results" })).toBeVisible();
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f8a-en-1280-results.png"),
    fullPage: true,
  });
  await page.getByLabel("Suspicious attempts only").click();
  await expect(page.getByText("Omar Ali").first()).toBeVisible();
  await expect(page.getByText("مريم حسن")).toHaveCount(0);
  await page.getByRole("link", { name: "View attempt" }).first().click();
  await expect(page.getByText("Correct answer")).toBeVisible();
  await expect(page.getByText("Student's answer")).toBeVisible();
}

test("teacher creates questions, targeted exam, duplicate, homework, lesson quiz, and reviews suspicious results", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await signInApprovedTeacherEn(page);

  await page.getByRole("link", { name: "Question bank" }).click();
  await page.getByRole("button", { name: "Add question" }).click();
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(
    page.getByText("Check the question text, options, and correct answer."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  await createMcq(page, "F8 E2E question one?", "Alpha", "Beta");
  await createMcq(page, "F8 E2E question two?", "Gamma", "Delta");
  await authorTargetedExamAndDuplicate(page);
  await authorHomeworkQuizAndReviewResults(page);
});

test("teacher navigates question bank and exam builder in Arabic RTL at 375px", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.getByLabel("البريد الإلكتروني").fill("teacher-approved@example.test");
  await page.getByLabel("كلمة المرور", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "تسجيل الدخول" }).click();
  await expect(page).toHaveURL(/\/teacher$/u);

  await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await page.getByRole("link", { name: "بنك الأسئلة" }).click();
  await page.getByRole("button", { name: "إغلاق قائمة التنقل" }).click();
  await expect(page.getByRole("heading", { name: "بنك الأسئلة" })).toBeVisible();

  await page.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await page.getByRole("link", { name: "كورساتي" }).click();
  await page.getByRole("button", { name: "إغلاق قائمة التنقل" }).click();
  await page.getByRole("link", { name: "فتح الكورس" }).click();
  await page.getByRole("tab", { name: "الاختبارات" }).click();
  await page.getByRole("button", { name: "إنشاء اختبار" }).click();
  await expect(page.getByRole("heading", { name: "إنشاء اختبار" })).toBeVisible();
  await expect(page.getByLabel("المدة بالدقائق")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: resolve(SCREENSHOTS, "f8a-ar-375-assessments.png"),
    fullPage: true,
  });
});

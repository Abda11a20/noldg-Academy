import { expect, test } from "./fixtures";
import { resolve } from "node:path";

const REPORTS = resolve(process.cwd(), "../../docs/reports");

test("admin opens academic and teacher administration at mobile and desktop widths", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Academic structure" }).click();
  await expect(page.getByRole("heading", { name: "Academic structure" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Tracks" })).toBeVisible();
  await page.getByRole("button", { name: "Add track" }).click();
  const trackDialog = page.getByRole("dialog", { name: "Add track" });
  await trackDialog.getByLabel("Name").fill("Test secondary track");
  await trackDialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Test secondary track").first()).toBeVisible();
  await page.screenshot({ path: resolve(REPORTS, "f3-academic-en-1280.png"), fullPage: true });

  await page.getByRole("link", { name: "Teachers", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teachers" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Salma Hassan" })).toBeVisible();
  await page.getByRole("button", { name: "View application" }).first().click();
  await page.getByRole("menuitem", { name: "View application" }).click();
  await expect(page.getByRole("heading", { name: "Teacher application" })).toBeVisible();
  await page.screenshot({
    path: resolve(REPORTS, "f3-application-detail-en-1280.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve" }).click();
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(
    page.getByText("The application decision was saved.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Teachers" })).toBeVisible();
  await page.screenshot({ path: resolve(REPORTS, "f3-teachers-en-1280.png"), fullPage: true });

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.evaluate(() => {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.getByLabel("Email address").fill("teacher-pending@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  const loginResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/auth/login"),
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  const loginResponse = await loginResponsePromise;
  const loginBody = (await loginResponse.json()) as { user?: { applicationStatus?: string } };
  expect(loginBody.user?.applicationStatus).toBe("approved");
  await expect(page).toHaveURL(/\/teacher$/);
  await expect(page.getByText("Signed in as Teacher")).toBeVisible();
  await page.screenshot({
    path: resolve(REPORTS, "f3-approved-teacher-en-1280.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Main navigation" })).toBeVisible();
  await page.screenshot({ path: resolve(REPORTS, "f3-teachers-en-375.png"), fullPage: true });
  await page.getByRole("button", { name: "Close navigation" }).click();

  await page.getByRole("button", { name: "Change language" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({ path: resolve(REPORTS, "f3-teachers-ar-375.png"), fullPage: true });
});

test("admin rejects a teacher application and the same teacher resubmits", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill("admin@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Teachers", exact: true }).click();
  await page.getByRole("button", { name: "View application" }).first().click();
  await page.getByRole("menuitem", { name: "View application" }).click();
  await page.getByRole("button", { name: "Reject" }).click();
  await page.getByLabel("Reason").fill("Needs more evidence of relevant classroom experience.");
  await page.getByRole("button", { name: "Save decision" }).click();
  await expect(
    page.getByText("The application decision was saved.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out" }).click();
  await page.evaluate(() => {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await page.getByLabel("Email address").fill("teacher-pending@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher\/pending$/);
  await expect(
    page.getByText("Needs more evidence of relevant classroom experience."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit and resubmit" }).click();
  await expect(page).toHaveURL(/\/teacher\/pending$/);
  await page.screenshot({
    path: resolve(REPORTS, "f3-resubmitted-teacher-en-1280.png"),
    fullPage: true,
  });
});

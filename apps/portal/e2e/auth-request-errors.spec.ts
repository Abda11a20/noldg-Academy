import { expect, test } from "./fixtures";

async function openEnglishLogin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
}

test("rate limits login and disables retry", async ({ page, declareExpectedApiFailure }) => {
  await openEnglishLogin(page);
  await page.getByLabel("Email address").fill("rate-limited@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  declareExpectedApiFailure({ method: "POST", urlPattern: /\/api\/auth\/login$/u, status: 429 });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Too many attempts. Wait 30 seconds and try again.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
});

test("network failures show the generic request message", async ({
  page,
  declareExpectedApiFailure,
}) => {
  await openEnglishLogin(page);
  await page.getByLabel("Email address").fill("network-failure@example.test");
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  declareExpectedApiFailure({
    method: "POST",
    urlPattern: /\/api\/auth\/login$/u,
    status: "network",
  });
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("The request could not be completed. Try again.")).toBeVisible();
});

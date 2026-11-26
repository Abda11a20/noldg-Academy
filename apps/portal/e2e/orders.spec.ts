import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const SCREENSHOTS = resolve(process.cwd(), "../../docs/reports/screenshots");
mkdirSync(SCREENSHOTS, { recursive: true });

async function navigateClient(page: Page, path: string): Promise<void> {
  await page.evaluate((nextPath) => {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: "تغيير اللغة" }).click();
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Aa1!pass");
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("student submits an order, sees its receipt, and finds it in purchases", async ({ page }) => {
  await signIn(page, "student@example.test");
  await expect(page).toHaveURL(/\/student$/);
  await navigateClient(page, "/student/checkout/product-introduction");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "InstaPay" }).click();
  await page.getByLabel("Your sender or wallet number").fill("01012345678");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.getByRole("heading", { name: "Order created" })).toBeVisible();
  const receiptText = await page.getByText(/Order number: ORD-/).textContent();
  const orderNumber = receiptText?.match(/ORD-[\da-f-]+/i)?.[0];
  await page.screenshot({ path: resolve(SCREENSHOTS, "f6-checkout-en-1280.png"), fullPage: true });
  await page.getByRole("link", { name: "My purchases" }).click();
  await expect(page).toHaveURL(/\/student\/purchases$/);
  if (orderNumber) await expect(page.getByText(orderNumber)).toBeVisible();
});

test("admin creates a manual cash order and approves a pending payment", async ({ page }) => {
  await signIn(page, "admin@example.test");
  await expect(page).toHaveURL(/\/admin$/);
  await navigateClient(page, "/admin/orders/new");
  await page.getByLabel("Student ID").fill("student-mona");
  await page.getByLabel("Product ID").fill("product-introduction");
  await page.getByRole("button", { name: "Create and approve" }).first().click();
  await page
    .getByRole("dialog", { name: "Confirm manual cash order" })
    .getByRole("button", { name: "Create and approve" })
    .click();
  await expect(page.getByRole("heading", { name: /Order details: ORD-/ })).toBeVisible();
  await navigateClient(page, "/admin/orders");
  await page.getByRole("link", { name: "ORD-2026-00041" }).click();
  await page.getByRole("button", { name: "Approve payment" }).click();
  await page.getByRole("button", { name: "Approve order" }).click();
  await expect(page.getByText("Completed").last()).toBeVisible();
});

test("student cancels a pending order after confirming", async ({ page }) => {
  await signIn(page, "student@example.test");
  await expect(page).toHaveURL(/\/student$/);
  await navigateClient(page, "/student/purchases/order-awaiting-soon");
  await expect(page.getByRole("heading", { name: "Order details" })).toBeVisible();
  await page.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(page.getByText("Cancelled").last()).toBeVisible();
});

test("admin rejects a pending payment with a reason", async ({ page }) => {
  await signIn(page, "admin@example.test");
  await expect(page).toHaveURL(/\/admin$/);
  await navigateClient(page, "/admin/orders/order-awaiting-soon");
  await expect(page.getByRole("heading", { name: /Order details: ORD-/ })).toBeVisible();
  await page.getByRole("button", { name: "Reject order" }).click();
  await page.getByRole("textbox", { name: "Reason for rejection" }).fill("Payment not received");
  await page.getByRole("dialog").getByRole("button", { name: "Reject order" }).click();
  await expect(page.getByText("Order decision saved.", { exact: true })).toBeVisible();
});

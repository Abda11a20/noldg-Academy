import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Route, Routes } from "react-router";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { CheckoutPage } from "./CheckoutPage";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("reviews the server price, submits payment details, and shows the server order number", async () => {
  const user = userEvent.setup();
  renderPage(
    <Routes>
      <Route path="/student/checkout/:productId" element={<CheckoutPage />} />
    </Routes>,
    undefined,
    ["/student/checkout/product-introduction"],
  );
  await user.click(await screen.findByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("radio", { name: "InstaPay" }));
  await user.type(
    screen.getByRole("textbox", { name: "Your sender or wallet number" }),
    "01012345678",
  );
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Confirm order" }));
  expect(await screen.findByRole("heading", { name: "Order created" })).toBeTruthy();
  expect(screen.getByText(/ORD-2026-/)).toBeTruthy();
  expect(screen.getByRole("link", { name: "My purchases" })).toBeTruthy();
});

it("shows a safe retry state when the server pricing request fails", async () => {
  const { http, HttpResponse, nodeServer } = await import("@noldg/api/mocks/testing");
  const { API_BASE_URL } = await import("@noldg/api/constants/http");
  nodeServer.use(
    http.get(`${API_BASE_URL}/products/:productId/pricing`, () =>
      HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 }),
    ),
  );
  renderPage(
    <Routes>
      <Route path="/student/checkout/:productId" element={<CheckoutPage />} />
    </Routes>,
    undefined,
    ["/student/checkout/product-introduction"],
  );
  expect(await screen.findByRole("alert")).toBeTruthy();
});

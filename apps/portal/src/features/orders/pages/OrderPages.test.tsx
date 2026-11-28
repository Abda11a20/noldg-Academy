import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Route, Routes } from "react-router";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { PurchasesPage } from "./PurchasesPage";
import { OrderDetailPage } from "./OrderDetailPage";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { AdminOrderDetailPage } from "./AdminOrderDetailPage";
import { ManualOrderPage } from "./ManualOrderPage";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("renders an empty purchase history and a clear permission failure", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/orders/my`, () =>
      HttpResponse.json({ items: [], page: 1, pageSize: 10, total: 0 }),
    ),
  );
  renderPage(<PurchasesPage />, undefined, ["/student/purchases"]);
  expect(await screen.findByText("No orders yet")).toBeTruthy();
  cleanup();
  nodeServer.use(
    http.get(`${API_BASE_URL}/orders/my`, () =>
      HttpResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 }),
    ),
  );
  renderPage(<PurchasesPage />, undefined, ["/student/purchases"]);
  expect(await screen.findByText("You do not have permission to view these orders.")).toBeTruthy();
});

it("shows a safe error state for a failed admin queue request", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/admin/orders`, () =>
      HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 500 }),
    ),
  );
  renderPage(<AdminOrdersPage />, undefined, ["/admin/orders"]);
  expect(await screen.findByRole("alert")).toBeTruthy();
});

it("restores admin filters from the URL and sends them to the API", async () => {
  let requestedUrl: URL | undefined;
  nodeServer.use(
    http.get(`${API_BASE_URL}/admin/orders`, ({ request }) => {
      requestedUrl = new URL(request.url);
      return HttpResponse.json({ items: [], page: 1, pageSize: 20, total: 0 });
    }),
  );
  renderPage(<AdminOrdersPage />, undefined, [
    `/admin/orders?filters=${encodeURIComponent(
      JSON.stringify({ status: "awaiting_payment", teacherId: "teacher-1", expiringSoon: "true" }),
    )}`,
  ]);
  expect(await screen.findByRole("switch", { name: "Expiring soon" })).toBeTruthy();
  await waitFor(() => {
    expect(requestedUrl?.searchParams.get("teacherId")).toBe("teacher-1");
    expect(requestedUrl?.searchParams.get("expiringSoon")).toBe("true");
    expect(requestedUrl?.searchParams.get("status")).toBe("awaiting_payment");
  });
  await userEvent.setup().click(screen.getByRole("tab", { name: "Completed" }));
  await waitFor(() => {
    expect(requestedUrl?.searchParams.get("teacherId")).toBe("teacher-1");
    expect(requestedUrl?.searchParams.get("expiringSoon")).toBe("true");
    expect(requestedUrl?.searchParams.get("status")).toBe("completed");
  });
});

it("cancels only the selected awaiting order after confirmation", async () => {
  const user = userEvent.setup();
  renderPage(
    <Routes>
      <Route path="/student/purchases/:orderId" element={<OrderDetailPage />} />
    </Routes>,
    undefined,
    ["/student/purchases/order-awaiting-soon"],
  );
  await user.click(await screen.findByRole("button", { name: "Cancel order" }));
  await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
  expect(await screen.findByText("Cancelled")).toBeTruthy();
});

it("requires an admin to confirm rejection with a reason", async () => {
  const user = userEvent.setup();
  renderPage(
    <Routes>
      <Route path="/admin/orders/:orderId" element={<AdminOrderDetailPage />} />
    </Routes>,
    undefined,
    ["/admin/orders/order-awaiting-soon"],
  );
  await user.click(await screen.findByRole("button", { name: "Reject order" }));
  await user.type(
    screen.getByRole("textbox", { name: "Reason for rejection" }),
    "Payment not received",
  );
  const rejectButtons = screen.getAllByRole("button", { name: "Reject order" });
  const confirmationButton = rejectButtons[rejectButtons.length - 1];
  if (!confirmationButton) throw new Error("Expected a rejection confirmation button.");
  await user.click(confirmationButton);
  expect(await screen.findByText("Order decision saved.")).toBeTruthy();
});

it("provides the manual cash order fields in mock mode", () => {
  renderPage(<ManualOrderPage />, undefined, ["/admin/orders/new"]);
  expect(screen.getByRole("heading", { name: "Create manual cash order" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Student ID" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Product ID" })).toBeTruthy();
});

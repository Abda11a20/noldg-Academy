import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, nodeServer } from "@noldg/api/mocks/testing";
import { API_BASE_URL } from "@noldg/api/constants/http";
import { OrderSummarySchema } from "@noldg/api/contracts/orders";
import { afterEach, beforeEach, expect, it } from "vitest";
import { Route, Routes } from "react-router";
import { renderPage } from "../../../shared/testing/render-page";
import i18n from "../../../shared/i18n";
import { ManualOrderPage } from "./ManualOrderPage";

beforeEach(async () => i18n.changeLanguage("en"));
afterEach(cleanup);

it("confirms a manual cash order with the server preview and optional sender reference", async () => {
  const user = userEvent.setup();
  let receivedBody: unknown;
  nodeServer.use(
    http.get(`${API_BASE_URL}/products/manual-product/pricing`, () =>
      HttpResponse.json({
        product: {
          id: "manual-product",
          courseId: "course-math",
          type: "lesson",
          name: "Algebra lesson",
          price: 500,
          status: "active",
        },
        pricing: {
          fullPrice: 500,
          currentPrice: 500,
          announcedLessonCount: 1,
          remainingLessonCount: 1,
          commissionPercentage: 20,
          platformAmount: 100,
          teacherAmount: 400,
          isPurchasable: true,
        },
      }),
    ),
    http.post(`${API_BASE_URL}/admin/orders/manual`, async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json(
        OrderSummarySchema.parse({
          id: "manual-order-created",
          orderNumber: "ORD-2026-00042",
          status: "completed",
          priceSnapshot: { fullPrice: 500, amount: 500 },
          paymentMethod: "cash",
          senderRef: "Cash desk 4",
          expiresAt: null,
          createdAt: "2026-11-27T10:00:00.000Z",
          product: { id: "manual-product", name: "Algebra lesson", type: "lesson" },
          teacher: { id: "teacher-nour", name: "Nour Hassan" },
          student: { id: "student-mona", name: "منى علي", phone: "+201011112222" },
          payment: { status: "confirmed", notes: null, createdAt: "2026-11-27T10:00:00.000Z" },
        }),
        { status: 201 },
      );
    }),
  );
  renderPage(
    <Routes>
      <Route element={<ManualOrderPage />} path="/admin/orders/new" />
    </Routes>,
    undefined,
    ["/admin/orders/new"],
  );

  await user.type(screen.getByRole("textbox", { name: "Student ID" }), "student-mona");
  await user.type(screen.getByRole("textbox", { name: "Product ID" }), "manual-product");
  await user.type(
    screen.getByRole("textbox", { name: "Optional sender reference or note" }),
    "Cash desk 4",
  );
  expect(await screen.findByText(/What you pay now:/u)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Create and approve" }));
  const confirmButtons = screen.getAllByRole("button", { name: "Create and approve" });
  const confirmButton = confirmButtons[confirmButtons.length - 1];
  if (!confirmButton) throw new Error("Expected the confirmation action.");
  await user.click(confirmButton);

  await waitFor(() =>
    expect(receivedBody).toEqual({
      studentId: "student-mona",
      productId: "manual-product",
      paymentMethod: "cash",
      senderRef: "Cash desk 4",
    }),
  );
});

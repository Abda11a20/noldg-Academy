import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import { nodeServer } from "../../mocks/node";
import type * as OrdersApi from "./index";

let ordersApi: typeof OrdersApi;
let submittedOrderBody: unknown;
let submittedPaymentBody: unknown;

const legacyOrder = {
  id: "order-legacy",
  referenceNumber: "ORD-legacy-uuid",
  studentId: "student-legacy",
  teacherId: "teacher-legacy",
  productId: "product-legacy",
  productName: "Mathematics lessons",
  productType: "package",
  status: "pending_payment",
  fullPrice: 800,
  salePrice: 600,
  announcedLessonCount: 8,
  remainingLessonCount: 6,
  createdAt: "2026-11-25T10:00:00.000Z",
  student: { id: "student-legacy", name: "Mona Ali", phone: "+201011112222" },
  payment: null,
  approval: null,
};

beforeAll(async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.resetModules();
  ordersApi = await import("./index");
});

afterEach(() => {
  submittedOrderBody = undefined;
  submittedPaymentBody = undefined;
  vi.unstubAllEnvs();
});

it("uses the legacy two-step order/payment flow without sending unsupported fields", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/orders`, async ({ request }) => {
      submittedOrderBody = await request.json();
      return HttpResponse.json({ success: true, data: legacyOrder }, { status: 201 });
    }),
    http.post(`${API_BASE_URL}/payments`, async ({ request }) => {
      submittedPaymentBody = await request.json();
      return HttpResponse.json({ success: true, data: { id: "payment-1" } }, { status: 201 });
    }),
    http.get(`${API_BASE_URL}/orders/order-legacy`, () =>
      HttpResponse.json({
        success: true,
        data: {
          ...legacyOrder,
          status: "pending_review",
          payment: {
            status: "submitted",
            notes: JSON.stringify({ paymentMethod: "instapay", senderRef: "+201011112222" }),
            createdAt: "2026-11-25T10:01:00.000Z",
          },
        },
      }),
    ),
  );

  const order = await ordersApi.createOrder(
    { productId: "product-legacy", paymentMethod: "instapay", senderRef: "+201011112222" },
    "stable-idempotency-key",
  );
  expect(submittedOrderBody).toEqual({ productId: "product-legacy" });
  expect(submittedPaymentBody).toEqual({
    orderId: "order-legacy",
    notes: JSON.stringify({ paymentMethod: "instapay", senderRef: "+201011112222" }),
  });
  expect(order).toMatchObject({
    orderNumber: "ORD-legacy-uuid",
    status: "awaiting_payment",
    senderRef: "+201011112222",
  });
});

it("surfaces the saved order when the second payment request fails", async () => {
  nodeServer.use(
    http.post(`${API_BASE_URL}/orders`, () =>
      HttpResponse.json({ data: legacyOrder }, { status: 201 }),
    ),
    http.post(`${API_BASE_URL}/payments`, () =>
      HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 }),
    ),
  );
  await expect(
    ordersApi.createOrder(
      { productId: "product-legacy", paymentMethod: "wallet", senderRef: "01011112222" },
      "retry-key",
    ),
  ).rejects.toMatchObject({
    code: "ORDER_PAYMENT_SUBMISSION_FAILED",
    details: { orderId: "order-legacy", orderNumber: "ORD-legacy-uuid" },
  });
});

it("normalizes server pagination and legacy settings", async () => {
  nodeServer.use(
    http.get(`${API_BASE_URL}/orders/my`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("limit")).toBe("2");
      expect(url.searchParams.get("page")).toBe("2");
      return HttpResponse.json({
        count: 3,
        data: [{ ...legacyOrder, status: "approved" }],
        pagination: { page: 2, limit: 2, total: 3, pages: 2 },
      });
    }),
    http.get(`${API_BASE_URL}/settings`, () =>
      HttpResponse.json({
        data: { paymentInstructions: "Transfer to support", supportPhone: "+201001234567" },
      }),
    ),
  );
  const list = await ordersApi.getStudentOrders({ page: 2, pageSize: 2, search: "" });
  const settings = await ordersApi.getOrderSettings();
  expect(list).toMatchObject({ page: 2, pageSize: 2, total: 3, items: [{ status: "completed" }] });
  expect(settings).toEqual({
    paymentInstructions: "Transfer to support",
    supportWhatsappNumber: "+201001234567",
    orderExpiryHours: null,
  });
});

it("uses the current review route and resolves the updated order", async () => {
  let reviewBody: unknown;
  nodeServer.use(
    http.patch(`${API_BASE_URL}/order-approval/:orderId/review`, async ({ request }) => {
      reviewBody = await request.json();
      return HttpResponse.json({ data: { ...legacyOrder, status: "approved" } });
    }),
    http.get(`${API_BASE_URL}/orders/order-legacy`, () =>
      HttpResponse.json({ data: { ...legacyOrder, status: "approved" } }),
    ),
  );
  expect((await ordersApi.approveOrder("order-legacy")).status).toBe("completed");
  expect(reviewBody).toEqual({ status: "approved" });
});

it("maps supported status filters and omits target-only admin search from the live query", async () => {
  let capturedUrl: URL | undefined;
  nodeServer.use(
    http.get(`${API_BASE_URL}/orders`, ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json({
        data: [],
        count: 0,
        pagination: { page: 1, limit: 10, total: 0 },
      });
    }),
  );
  await ordersApi.getAdminOrders({
    page: 1,
    pageSize: 10,
    status: "completed",
    search: "Mona",
    teacherId: "teacher-legacy",
    expiringSoon: true,
  });
  expect(capturedUrl?.searchParams.get("status")).toBe("approved");
  expect(capturedUrl?.searchParams.get("q")).toBeNull();
  expect(capturedUrl?.searchParams.get("teacherId")).toBeNull();
  expect(capturedUrl?.searchParams.get("expiringSoon")).toBeNull();
});

it.each(["rejected", "awaiting_payment", "closed"] as const)(
  "keeps the current backend status behavior for %s",
  async (status) => {
    let capturedStatus: string | null = null;
    nodeServer.use(
      http.get(`${API_BASE_URL}/orders`, ({ request }) => {
        capturedStatus = new URL(request.url).searchParams.get("status");
        return HttpResponse.json({ data: [legacyOrder] });
      }),
    );
    const list = await ordersApi.getAdminOrders({ page: 1, pageSize: 10, status, search: "" });
    expect(list).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      items: [{ status: "awaiting_payment" }],
    });
    expect(capturedStatus).toBe(status === "rejected" ? "rejected" : null);
  },
);

it("preserves normalized HTTP failures when reviewing an order", async () => {
  nodeServer.use(
    http.patch(`${API_BASE_URL}/order-approval/:orderId/review`, () =>
      HttpResponse.json({ error: { code: "ORDER_ALREADY_PROCESSED" } }, { status: 409 }),
    ),
  );
  await expect(ordersApi.approveOrder("order-legacy")).rejects.toMatchObject({
    code: "ORDER_ALREADY_PROCESSED",
    status: 409,
  });
});

it("posts rejection reasons through the current review contract", async () => {
  let reviewBody: unknown;
  nodeServer.use(
    http.patch(`${API_BASE_URL}/order-approval/:orderId/review`, async ({ request }) => {
      reviewBody = await request.json();
      return HttpResponse.json({ data: { ...legacyOrder, status: "rejected" } });
    }),
    http.get(`${API_BASE_URL}/orders/order-legacy`, () =>
      HttpResponse.json({
        data: {
          ...legacyOrder,
          status: "rejected",
          approval: { reason: "No matching payment was found." },
        },
      }),
    ),
  );
  expect(
    (await ordersApi.rejectOrder("order-legacy", "  No matching payment was found.  ")).status,
  ).toBe("rejected");
  expect(reviewBody).toEqual({ status: "rejected", reason: "No matching payment was found." });
});

it("reports missing legacy cancellation and manual-order target capabilities", async () => {
  await expect(ordersApi.cancelOrder("order-legacy")).rejects.toMatchObject({
    code: "CAPABILITY_UNAVAILABLE",
  });
  await expect(
    ordersApi.createManualOrder(
      { studentId: "student-1", productId: "product-1", paymentMethod: "cash" },
      "key",
    ),
  ).rejects.toMatchObject({ code: "CAPABILITY_UNAVAILABLE" });
});

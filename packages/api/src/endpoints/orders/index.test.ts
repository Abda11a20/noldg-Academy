import { beforeEach, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { API_BASE_URL } from "../../constants/http";
import {
  getAdminOrders,
  getOrder,
  getOrderSettings,
  getStudentOrders,
  createOrder,
  createManualOrder,
  cancelOrder,
  approveOrder,
  rejectOrder,
} from "./index";
import { resetOrderMockState } from "../../mocks/handlers/orders";
import { nodeServer } from "../../mocks/node";
import { MOCK_ORDER_LIST } from "../../mocks/fixtures/orders";

beforeEach(resetOrderMockState);

it("loads localized payment instructions and server-paginated student purchases", async () => {
  const settings = await getOrderSettings();
  const orders = await getStudentOrders({
    page: 1,
    pageSize: 2,
    search: "",
    status: "awaiting_payment",
  });
  expect(settings.paymentInstructions).toMatchObject({
    ar: expect.any(String),
    en: expect.any(String),
  });
  expect(orders).toMatchObject({ page: 1, pageSize: 2, total: 1 });
  expect(orders.items[0]?.orderNumber).toBe("ORD-2026-00041");
});

it("filters the admin queue with server search and places awaiting orders first", async () => {
  const orders = await getAdminOrders({ page: 1, pageSize: 10, search: "", status: "closed" });
  expect(
    orders.items.every((order) => order.status === "expired" || order.status === "cancelled"),
  ).toBe(true);
  const searched = await getAdminOrders({ page: 1, pageSize: 10, search: "John" });
  expect(searched.items.every((order) => order.student?.name === "John Samir")).toBe(true);
});

it("applies the mock admin teacher, date-range, and expiring-soon filters", async () => {
  const filtered = await getAdminOrders({
    page: 1,
    pageSize: 10,
    search: "",
    teacherId: "teacher-nour",
    from: "2026-11-25T00:00:00.000Z",
    to: "2026-11-27T00:00:00.000Z",
    expiringSoon: true,
  });
  expect(filtered.items.map((order) => order.id)).toEqual(["order-awaiting-soon"]);
});

it("serializes every admin queue filter into the URL", async () => {
  let capturedUrl: URL | undefined;
  nodeServer.use(
    http.get(`${API_BASE_URL}/admin/orders`, ({ request }) => {
      capturedUrl = new URL(request.url);
      return HttpResponse.json(MOCK_ORDER_LIST);
    }),
  );
  await getAdminOrders({
    page: 3,
    pageSize: 15,
    status: "awaiting_payment",
    search: "Mona",
    teacherId: "teacher-nour",
    from: "2026-11-01T00:00:00.000Z",
    to: "2026-11-30T23:59:00.000Z",
    expiringSoon: true,
  });
  expect(capturedUrl?.searchParams.get("page")).toBe("3");
  expect(capturedUrl?.searchParams.get("pageSize")).toBe("15");
  expect(capturedUrl?.searchParams.get("status")).toBe("awaiting_payment");
  expect(capturedUrl?.searchParams.get("q")).toBe("Mona");
  expect(capturedUrl?.searchParams.get("teacherId")).toBe("teacher-nour");
  expect(capturedUrl?.searchParams.get("from")).toBe("2026-11-01T00:00:00.000Z");
  expect(capturedUrl?.searchParams.get("to")).toBe("2026-11-30T23:59:00.000Z");
  expect(capturedUrl?.searchParams.get("expiringSoon")).toBe("true");
});

it("creates a purchase, keeps the supplied price snapshot, and returns its detail", async () => {
  const order = await createOrder(
    { productId: "product-new", paymentMethod: "wallet", senderRef: "+201011112222" },
    "attempt-key",
  );
  expect(order.priceSnapshot.amount).toBe(500);
  expect(order.orderNumber).toBe("ORD-2026-00042");
  expect(await getOrder(order.id)).toEqual(order);
});

it.each([
  ["product-already-open", "ORDER_ALREADY_OPEN"],
  ["product-not-purchasable", "PRODUCT_NOT_PURCHASABLE"],
  ["product-owned", "PRODUCT_ALREADY_OWNED"],
  ["product-too-many-open", "TOO_MANY_OPEN_ORDERS"],
])("normalizes target purchase error %s", async (productId, code) => {
  await expect(
    createOrder({ productId, paymentMethod: "instapay", senderRef: "01011112222" }, "attempt"),
  ).rejects.toMatchObject({ code, status: 409 });
});

it.each([
  ["product-network-failure", "NETWORK_ERROR", 0],
  ["product-server-failure", "SERVER_ERROR", 503],
  ["product-rate-limited", "RATE_LIMITED", 429],
])("normalizes transport and server purchase failures for %s", async (productId, code, status) => {
  await expect(
    createOrder({ productId, paymentMethod: "wallet", senderRef: "01011112222" }, "attempt"),
  ).rejects.toMatchObject({ code, status });
});

it("cancels an awaiting order and blocks cancellation after processing", async () => {
  expect((await cancelOrder("order-awaiting-soon")).status).toBe("cancelled");
  await expect(cancelOrder("order-completed")).rejects.toMatchObject({
    code: "ORDER_NOT_CANCELLABLE",
  });
});

it("returns a detail order through the target admin route and reports missing records", async () => {
  expect((await getOrder("order-awaiting-soon", true)).orderNumber).toBe("ORD-2026-00041");
  await expect(getOrder("missing-order", true)).rejects.toMatchObject({ status: 404 });
});

it("rejects stale approval decisions", async () => {
  await expect(approveOrder("order-completed")).rejects.toMatchObject({
    code: "ORDER_ALREADY_PROCESSED",
  });
});

it("supports manual orders and approve/reject decisions", async () => {
  const manual = await createManualOrder(
    { studentId: "student-mona", productId: "product-cash", paymentMethod: "cash" },
    "manual-key",
  );
  expect(manual.status).toBe("completed");
  const rejected = await rejectOrder("order-awaiting-soon", "Not received");
  expect(rejected.status).toBe("rejected");
  const awaiting = await createOrder(
    { productId: "product-approve", paymentMethod: "cash", senderRef: "01011112222" },
    "approve-key",
  );
  expect((await approveOrder(awaiting.id)).status).toBe("completed");
});

it("requires a rejection explanation", async () => {
  await expect(rejectOrder("order-awaiting-soon", " ")).rejects.toMatchObject({
    code: "VALIDATION_ERROR",
  });
});

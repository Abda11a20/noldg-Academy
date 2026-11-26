import { http, HttpResponse } from "msw";
import {
  CreateOrderInputSchema,
  OrderListSchema,
  OrderSummarySchema,
  type OrderSummary,
} from "../../contracts/orders";
import { API_BASE_URL } from "../../constants/http";
import {
  MOCK_EXPIRING_SOON_CUTOFF,
  MOCK_ORDER_SERVER_NOW,
  MOCK_ORDER_SETTINGS,
  MOCK_ORDERS,
} from "../fixtures/orders";

let orders = structuredClone(MOCK_ORDERS);
let nextOrderNumber = 42;

/** Resets mutable order mock records between isolated API scenarios. */
export function resetOrderMockState(): void {
  orders = structuredClone(MOCK_ORDERS);
  nextOrderNumber = 42;
}

function paged(items: OrderSummary[], url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? 10));
  return OrderListSchema.parse({
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
    serverNow: MOCK_ORDER_SERVER_NOW,
  });
}

function orderNotFound() {
  return HttpResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
}

function matchesOrderStatus(order: OrderSummary, status: string | null): boolean {
  if (!status) return true;
  if (status === "closed") return order.status === "expired" || order.status === "cancelled";
  return order.status === status;
}

function matchesOrderSearch(order: OrderSummary, search: string | null): boolean {
  if (!search) return true;
  const searchableValues = [
    order.orderNumber,
    order.student?.name,
    order.student?.phone,
    order.teacher.name,
  ];
  return searchableValues.some((value) => value?.toLocaleLowerCase("en-US").includes(search));
}

function matchesOrderDate(order: OrderSummary, from: string | null, to: string | null): boolean {
  return (!from || order.createdAt >= from) && (!to || order.createdAt <= to);
}

function matchesExpiringSoon(order: OrderSummary, expiringSoon: boolean): boolean {
  if (!expiringSoon) return true;
  return (
    order.expiresAt !== null &&
    order.expiresAt >= MOCK_ORDER_SERVER_NOW &&
    order.expiresAt <= MOCK_EXPIRING_SOON_CUTOFF
  );
}

function matchesOrderFilters(order: OrderSummary, url: URL): boolean {
  const status = url.searchParams.get("status");
  const teacherId = url.searchParams.get("teacherId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const expiringSoon = url.searchParams.get("expiringSoon") === "true";
  const search = url.searchParams.get("q")?.toLocaleLowerCase("en-US") ?? null;
  return (
    matchesOrderStatus(order, status) &&
    (!teacherId || order.teacher.id === teacherId) &&
    matchesOrderDate(order, from, to) &&
    matchesExpiringSoon(order, expiringSoon) &&
    matchesOrderSearch(order, search)
  );
}

function filterOrderList(url: URL): OrderSummary[] {
  return orders
    .filter((order) => matchesOrderFilters(order, url))
    .sort(
      (left, right) =>
        Number(right.status === "awaiting_payment") - Number(left.status === "awaiting_payment"),
    );
}

function createCashOrder(studentId: string, productId: string): OrderSummary {
  return OrderSummarySchema.parse({
    id: `order-${nextOrderNumber}`,
    orderNumber: `ORD-2026-${String(nextOrderNumber).padStart(5, "0")}`,
    status: "completed",
    priceSnapshot: { fullPrice: 500, amount: 500 },
    paymentMethod: "cash",
    senderRef: null,
    expiresAt: null,
    createdAt: MOCK_ORDER_SERVER_NOW,
    serverNow: MOCK_ORDER_SERVER_NOW,
    product: { id: productId, name: "Selected learning product", type: "lesson" },
    teacher: { id: "teacher-nour", name: "Nour Hassan" },
    student: { id: studentId, name: "منى علي", phone: "+201011112222" },
    payment: { status: "confirmed", notes: null, createdAt: MOCK_ORDER_SERVER_NOW },
  });
}

export const orderHandlers = [
  http.get(`${API_BASE_URL}/settings`, () => HttpResponse.json(MOCK_ORDER_SETTINGS)),
  http.get(`${API_BASE_URL}/orders/my`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? orders.filter((order) => order.status === status) : orders;
    return HttpResponse.json(paged(filtered, url));
  }),
  http.get(`${API_BASE_URL}/admin/orders`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paged(filterOrderList(url), url));
  }),
  http.get(`${API_BASE_URL}/admin/orders/:orderId`, ({ params }) => {
    const order = orders.find((item) => item.id === params.orderId);
    return order ? HttpResponse.json(order) : orderNotFound();
  }),
  http.get(`${API_BASE_URL}/orders/:orderId`, ({ params }) => {
    const order = orders.find((item) => item.id === params.orderId);
    return order ? HttpResponse.json(order) : orderNotFound();
  }),
  http.post(`${API_BASE_URL}/orders`, async ({ request }) => {
    const inputResult = CreateOrderInputSchema.safeParse(await request.json());
    if (!inputResult.success)
      return HttpResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
    const { productId, paymentMethod, senderRef } = inputResult.data;
    if (productId === "product-owned")
      return HttpResponse.json({ error: { code: "PRODUCT_ALREADY_OWNED" } }, { status: 409 });
    if (productId === "product-not-purchasable")
      return HttpResponse.json({ error: { code: "PRODUCT_NOT_PURCHASABLE" } }, { status: 409 });
    if (productId === "product-too-many-open")
      return HttpResponse.json({ error: { code: "TOO_MANY_OPEN_ORDERS" } }, { status: 409 });
    if (productId === "product-already-open")
      return HttpResponse.json(
        { error: { code: "ORDER_ALREADY_OPEN", details: { orderId: "order-awaiting-soon" } } },
        { status: 409 },
      );
    if (productId === "product-network-failure") return HttpResponse.error();
    if (productId === "product-server-failure")
      return HttpResponse.json({ error: { code: "SERVER_ERROR" } }, { status: 503 });
    if (productId === "product-rate-limited")
      return HttpResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
    const order = OrderSummarySchema.parse({
      id: `order-${nextOrderNumber}`,
      orderNumber: `ORD-2026-${String(nextOrderNumber).padStart(5, "0")}`,
      status: "awaiting_payment",
      priceSnapshot: { fullPrice: 500, announcedCount: 4, remainingCount: 4, amount: 500 },
      paymentMethod,
      senderRef,
      expiresAt: "2026-11-28T10:00:00.000Z",
      createdAt: MOCK_ORDER_SERVER_NOW,
      serverNow: MOCK_ORDER_SERVER_NOW,
      product: { id: productId, name: "Selected learning product", type: "package" },
      teacher: { id: "teacher-nour", name: "Nour Hassan" },
      student: { id: "student-mona", name: "منى علي", phone: "+201011112222" },
      payment: { status: "submitted", notes: null, createdAt: MOCK_ORDER_SERVER_NOW },
    });
    nextOrderNumber += 1;
    orders = [order, ...orders];
    return HttpResponse.json(order, { status: 201 });
  }),
  http.post(`${API_BASE_URL}/admin/orders/manual`, async ({ request }) => {
    const body = (await request.json()) as { studentId: string; productId: string };
    const order = createCashOrder(body.studentId, body.productId);
    nextOrderNumber += 1;
    orders = [order, ...orders];
    return HttpResponse.json(order, { status: 201 });
  }),
  http.post(`${API_BASE_URL}/orders/:orderId/cancel`, ({ params }) => {
    const index = orders.findIndex((order) => order.id === params.orderId);
    if (index < 0) return orderNotFound();
    const order = orders[index];
    if (!order || order.status !== "awaiting_payment")
      return HttpResponse.json({ error: { code: "ORDER_NOT_CANCELLABLE" } }, { status: 409 });
    orders[index] = { ...order, status: "cancelled" };
    return HttpResponse.json(orders[index]);
  }),
  http.post(`${API_BASE_URL}/admin/orders/:orderId/approve`, ({ params }) => {
    const index = orders.findIndex((order) => order.id === params.orderId);
    if (index < 0) return orderNotFound();
    const current = orders[index];
    if (!current || current.status !== "awaiting_payment")
      return HttpResponse.json({ error: { code: "ORDER_ALREADY_PROCESSED" } }, { status: 409 });
    orders[index] = {
      ...current,
      status: "completed",
      payment: {
        status: "confirmed",
        notes: current.payment?.notes ?? null,
        createdAt: MOCK_ORDER_SERVER_NOW,
      },
    };
    return HttpResponse.json(orders[index]);
  }),
  http.post(`${API_BASE_URL}/admin/orders/:orderId/reject`, async ({ params, request }) => {
    const body = (await request.json()) as { reason: string };
    const index = orders.findIndex((order) => order.id === params.orderId);
    if (index < 0) return orderNotFound();
    const current = orders[index];
    if (!current || current.status !== "awaiting_payment")
      return HttpResponse.json({ error: { code: "ORDER_ALREADY_PROCESSED" } }, { status: 409 });
    orders[index] = { ...current, status: "rejected", rejectionReason: body.reason };
    return HttpResponse.json(orders[index]);
  }),
];

import { expect, it } from "vitest";
import { adaptOrder, adaptOrderErrorCode } from "./orders";

const currentOrder = {
  id: "order-legacy",
  referenceNumber: "ORD-0000-legacy",
  studentId: "student-1",
  teacherId: "teacher-1",
  productId: "product-1",
  productName: "Algebra",
  productType: "package",
  status: "pending_review",
  fullPrice: 800,
  salePrice: 600,
  announcedLessonCount: 8,
  remainingLessonCount: 6,
  createdAt: "2026-11-25T10:00:00.000Z",
  student: { id: "student-1", name: "منى علي", phone: "+201011112222" },
  payment: {
    status: "submitted",
    notes: JSON.stringify({ paymentMethod: "instapay", senderRef: "+201011112222" }),
    createdAt: "2026-11-25T10:01:00.000Z",
  },
  approval: null,
};

it("maps the backend order, snapshot, payment note, and pending review status", () => {
  expect(adaptOrder(currentOrder, "live")).toMatchObject({
    orderNumber: "ORD-0000-legacy",
    status: "awaiting_payment",
    paymentMethod: "instapay",
    senderRef: "+201011112222",
    priceSnapshot: { fullPrice: 800, announcedCount: 8, remainingCount: 6, amount: 600 },
    teacher: { id: "teacher-1", name: null },
  });
});

it.each([
  ["pending_payment", "awaiting_payment"],
  ["approved", "completed"],
  ["rejected", "rejected"],
  ["expired", "expired"],
  ["cancelled", "cancelled"],
])("maps legacy status %s to %s", (legacyStatus, targetStatus) => {
  expect(adaptOrder({ ...currentOrder, status: legacyStatus }, "live").status).toBe(targetStatus);
});

it("maps legacy payment data without JSON metadata and handles absent relationships", () => {
  const order = adaptOrder(
    {
      ...currentOrder,
      payment: { status: "submitted", notes: "manual note", createdAt: null },
      student: undefined,
    },
    "live",
  );
  expect(order.senderRef).toBe("manual note");
  expect(order.paymentMethod).toBeNull();
  expect(order.student).toBeUndefined();
  expect(adaptOrder({ ...currentOrder, payment: null }, "live").payment).toBeNull();
});

it("keeps malformed payment metadata as a safe sender reference", () => {
  const order = adaptOrder(
    {
      ...currentOrder,
      payment: { status: "submitted", notes: "{not-json", createdAt: null },
    },
    "live",
  );
  expect(order.paymentMethod).toBeNull();
  expect(order.senderRef).toBe("{not-json");
});

it("rejects malformed legacy records with a normalized response error", () => {
  expect(() => adaptOrder({ id: "incomplete" }, "live")).toThrowError("errors:invalidResponse");
});

it.each([
  ["HTTP_ERROR", { legacyMessage: "A pending order already exists." }, "ORDER_ALREADY_OPEN"],
  ["HTTP_ERROR", { legacyMessage: "This product was already purchased." }, "PRODUCT_ALREADY_OWNED"],
  ["HTTP_ERROR", { legacyMessage: "Product is not purchasable." }, "PRODUCT_NOT_PURCHASABLE"],
  ["HTTP_ERROR", { legacyMessage: "This order was already reviewed." }, "ORDER_ALREADY_PROCESSED"],
  ["ORDER_ALREADY_PROCESSED", undefined, "ORDER_ALREADY_PROCESSED"],
  ["HTTP_ERROR", undefined, "HTTP_ERROR"],
])("maps current error %s safely", (code, details, expected) => {
  expect(adaptOrderErrorCode(code, details)).toBe(expected);
});

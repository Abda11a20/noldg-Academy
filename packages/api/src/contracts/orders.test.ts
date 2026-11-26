import { expect, it } from "vitest";
import { CreateOrderInputSchema, OrderListQuerySchema, OrderSettingsSchema } from "./orders";

it("validates payment selection and sender reference without accepting price input", () => {
  expect(
    CreateOrderInputSchema.safeParse({
      productId: "product-1",
      paymentMethod: "instapay",
      senderRef: "+201011112222",
    }).success,
  ).toBe(true);
  expect(
    CreateOrderInputSchema.safeParse({
      productId: "product-1",
      paymentMethod: "bitcoin",
      senderRef: "",
      amount: 100,
    }).success,
  ).toBe(false);
});

it("allows the admin closed status and validates pagination values", () => {
  expect(OrderListQuerySchema.safeParse({ page: 1, pageSize: 10, status: "closed" }).success).toBe(
    true,
  );
  expect(OrderListQuerySchema.safeParse({ page: 0, pageSize: 10 }).success).toBe(false);
});

it("accepts both localized target and plain legacy payment instructions", () => {
  expect(
    OrderSettingsSchema.safeParse({
      paymentInstructions: { ar: "تعليمات", en: "Instructions" },
      supportWhatsappNumber: null,
      orderExpiryHours: 48,
    }).success,
  ).toBe(true);
  expect(
    OrderSettingsSchema.safeParse({
      paymentInstructions: "Instructions",
      supportWhatsappNumber: "+201001234567",
      orderExpiryHours: null,
    }).success,
  ).toBe(true);
});

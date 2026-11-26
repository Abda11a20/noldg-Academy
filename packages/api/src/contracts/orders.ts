import { z } from "zod";
import { IdSchema, IsoTimestampSchema, MoneySchema } from "./common";

export const OrderStatusSchema = z.enum([
  "awaiting_payment",
  "completed",
  "rejected",
  "expired",
  "cancelled",
]);
export const OrderListStatusSchema = OrderStatusSchema.or(z.literal("closed"));
export const PaymentMethodSchema = z.enum(["instapay", "wallet", "cash"]);
export const OrderErrorCodeSchema = z.enum([
  "ORDER_ALREADY_OPEN",
  "PRODUCT_NOT_PURCHASABLE",
  "PRODUCT_ALREADY_OWNED",
  "TOO_MANY_OPEN_ORDERS",
  "ORDER_EXPIRED",
  "ORDER_ALREADY_PROCESSED",
  "ORDER_NOT_CANCELLABLE",
  "ORDER_PAYMENT_SUBMISSION_FAILED",
]);

export const OrderPriceSnapshotSchema = z.object({
  fullPrice: MoneySchema,
  announcedCount: z.number().int().nonnegative().nullable().optional(),
  remainingCount: z.number().int().nonnegative().nullable().optional(),
  amount: MoneySchema,
});

export const OrderSummarySchema = z.object({
  id: IdSchema,
  orderNumber: z.string().min(1),
  status: OrderStatusSchema,
  priceSnapshot: OrderPriceSnapshotSchema,
  paymentMethod: PaymentMethodSchema.nullable(),
  senderRef: z.string().nullable(),
  expiresAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
  serverNow: IsoTimestampSchema.nullable().optional(),
  product: z.object({ id: IdSchema, name: z.string(), type: z.enum(["lesson", "package"]) }),
  teacher: z.object({ id: IdSchema, name: z.string().nullable() }),
  student: z.object({ id: IdSchema, name: z.string(), phone: z.string().nullable() }).optional(),
  rejectionReason: z.string().nullable().optional(),
  payment: z
    .object({
      status: z.string().nullable(),
      notes: z.string().nullable(),
      createdAt: IsoTimestampSchema.nullable(),
    })
    .nullable(),
});

export const OrderListSchema = z.object({
  items: z.array(OrderSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  serverNow: IsoTimestampSchema.optional(),
});

export const CreateOrderInputSchema = z.object({
  productId: IdSchema,
  paymentMethod: PaymentMethodSchema,
  senderRef: z.string().trim().min(1).max(64),
});
export const ManualOrderInputSchema = z.object({
  studentId: IdSchema,
  productId: IdSchema,
  paymentMethod: z.literal("cash"),
  senderRef: z.string().trim().max(64).optional(),
});
export const OrderSettingsSchema = z.object({
  paymentInstructions: z.union([z.string(), z.object({ ar: z.string(), en: z.string() })]),
  supportWhatsappNumber: z.string().nullable(),
  orderExpiryHours: z.number().int().positive().nullable(),
});
export const OrderReviewInputSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed") }),
  z.object({ status: z.literal("rejected"), reason: z.string().trim().min(1).max(1000) }),
]);
export const OrderListQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  status: OrderListStatusSchema.optional(),
  search: z.string().optional(),
  teacherId: IdSchema.optional(),
  from: IsoTimestampSchema.optional(),
  to: IsoTimestampSchema.optional(),
  expiringSoon: z.boolean().optional(),
});

export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type OrderSummary = z.infer<typeof OrderSummarySchema>;
export type OrderList = z.infer<typeof OrderListSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderInputSchema>;
export type ManualOrderInput = z.infer<typeof ManualOrderInputSchema>;
export type OrderSettings = z.infer<typeof OrderSettingsSchema>;
export type OrderReviewInput = z.infer<typeof OrderReviewInputSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;

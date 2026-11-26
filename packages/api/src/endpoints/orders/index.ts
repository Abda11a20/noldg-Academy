import { adaptOrder, adaptOrderErrorCode } from "../../adapters/orders";
import { capabilities } from "../../config/capabilities";
import {
  CreateOrderInputSchema,
  ManualOrderInputSchema,
  OrderListQuerySchema,
  OrderSettingsSchema,
  type CreateOrderInput,
  type ManualOrderInput,
  type OrderList,
  type OrderListQuery,
  type OrderSettings,
  type OrderSummary,
} from "../../contracts/orders";
import { AppError, normalizeAppError } from "../../errors/app-error";
import { request } from "../../http/client";
import { apiMode } from "../../mocks/mode";
import { signalOption, unknownResponseSchema } from "../catalog/common";
import { buildOrdersListQuery, parseOrdersList } from "./lists";

const ORDERS_PATH = "orders";
const ADMIN_ORDERS_PATH = "admin/orders";
const SETTINGS_PATH = "settings";
const PAYMENTS_PATH = "payments";
const ORDER_APPROVAL_PATH = "order-approval";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function dataFrom(payload: unknown): unknown {
  return isRecord(payload) && "data" in payload ? payload.data : payload;
}

function paymentNotes(input: Pick<CreateOrderInput, "paymentMethod" | "senderRef">): string {
  return JSON.stringify({ paymentMethod: input.paymentMethod, senderRef: input.senderRef });
}

function mappedError(error: unknown): AppError {
  const normalized = normalizeAppError(error);
  const code = adaptOrderErrorCode(normalized.code, normalized.details);
  return new AppError({ ...normalized, code });
}

async function submitLegacyPayment(orderId: string, notes: string): Promise<void> {
  await request(PAYMENTS_PATH, unknownResponseSchema, {
    method: "POST",
    body: { orderId, notes },
  });
}

async function getLegacyOrder(orderId: string): Promise<OrderSummary> {
  const payload = await request(
    `${ORDERS_PATH}/${encodeURIComponent(orderId)}`,
    unknownResponseSchema,
  );
  return adaptOrder(dataFrom(payload), "live");
}

function paymentSubmissionError(order: OrderSummary): AppError {
  return new AppError({
    code: "ORDER_PAYMENT_SUBMISSION_FAILED",
    status: 503,
    message_key: "errors:requestFailed",
    details: { orderId: order.id, orderNumber: order.orderNumber },
  });
}

/** Lists the authenticated student's server-paginated order history.
 * @param query URL-backed list filters.
 * @param signal Optional cancellation signal.
 */
export async function getStudentOrders(
  query: OrderListQuery,
  signal?: AbortSignal,
): Promise<OrderList> {
  const values = OrderListQuerySchema.parse(query);
  try {
    const payload = await request(
      `${ORDERS_PATH}/my${buildOrdersListQuery(values)}`,
      unknownResponseSchema,
      signalOption(signal),
    );
    return parseOrdersList(payload, values);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Lists the account manager's orders with target filters where supported.
 * @param query URL-backed list filters.
 * @param signal Optional cancellation signal.
 */
export async function getAdminOrders(
  query: OrderListQuery,
  signal?: AbortSignal,
): Promise<OrderList> {
  const values = OrderListQuerySchema.parse(query);
  try {
    const path = apiMode === "mock" ? ADMIN_ORDERS_PATH : ORDERS_PATH;
    const payload = await request(
      `${path}${buildOrdersListQuery(values)}`,
      unknownResponseSchema,
      signalOption(signal),
    );
    return parseOrdersList(payload, values);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Gets one student's order and maps the legacy order envelope.
 * @param orderId Opaque order identifier.
 * @param admin Selects the account-manager detail route.
 * @param signal Optional cancellation signal.
 */
export async function getOrder(
  orderId: string,
  admin = false,
  signal?: AbortSignal,
): Promise<OrderSummary> {
  try {
    const path =
      admin && apiMode === "mock"
        ? `${ADMIN_ORDERS_PATH}/${encodeURIComponent(orderId)}`
        : `${ORDERS_PATH}/${encodeURIComponent(orderId)}`;
    const payload = await request(path, unknownResponseSchema, signalOption(signal));
    return adaptOrder(dataFrom(payload), apiMode);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Loads public payment instructions and maps supported legacy settings.
 * @param signal Optional cancellation signal.
 */
export async function getOrderSettings(signal?: AbortSignal): Promise<OrderSettings> {
  const payload = await request(SETTINGS_PATH, unknownResponseSchema, signalOption(signal));
  const raw = dataFrom(payload);
  if (apiMode === "mock") return OrderSettingsSchema.parse(raw);
  if (!isRecord(raw))
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return OrderSettingsSchema.parse({
    paymentInstructions: typeof raw.paymentInstructions === "string" ? raw.paymentInstructions : "",
    supportWhatsappNumber: typeof raw.supportPhone === "string" ? raw.supportPhone : null,
    orderExpiryHours: null,
  });
}

/** Creates the target order, using the legacy two-step payment flow when needed.
 * @param input Product, chosen payment method, and sender reference.
 * @param idempotencyKey Stable key for a single confirmation attempt.
 */
export async function createOrder(
  input: CreateOrderInput,
  idempotencyKey: string,
): Promise<OrderSummary> {
  const values = CreateOrderInputSchema.parse(input);
  try {
    const payload = await request(ORDERS_PATH, unknownResponseSchema, {
      method: "POST",
      body: apiMode === "mock" ? values : { productId: values.productId },
      ...(capabilities.idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}),
    });
    const order = adaptOrder(dataFrom(payload), apiMode);
    if (apiMode === "mock" || capabilities.singleStepOrder) return order;
    try {
      await submitLegacyPayment(order.id, paymentNotes(values));
      return await getLegacyOrder(order.id);
    } catch {
      throw paymentSubmissionError(order);
    }
  } catch (error) {
    throw mappedError(error);
  }
}

/** Cancels an unpaid order when the server supports cancellation.
 * @param orderId Opaque order identifier.
 */
export async function cancelOrder(orderId: string): Promise<OrderSummary> {
  if (apiMode === "live" && !capabilities.orderCancellation)
    throw new AppError({
      code: "CAPABILITY_UNAVAILABLE",
      status: 501,
      message_key: "errors:capabilityUnavailable",
    });
  try {
    const payload = await request(
      `${ORDERS_PATH}/${encodeURIComponent(orderId)}/cancel`,
      unknownResponseSchema,
      { method: "POST" },
    );
    return adaptOrder(dataFrom(payload), apiMode);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Approves a submitted payment after the account manager confirms receipt.
 * @param orderId Opaque order identifier.
 */
export async function approveOrder(orderId: string): Promise<OrderSummary> {
  try {
    if (apiMode === "mock") {
      const payload = await request(
        `${ADMIN_ORDERS_PATH}/${encodeURIComponent(orderId)}/approve`,
        unknownResponseSchema,
        { method: "POST" },
      );
      return adaptOrder(dataFrom(payload), "mock");
    }
    await request(
      `${ORDER_APPROVAL_PATH}/${encodeURIComponent(orderId)}/review`,
      unknownResponseSchema,
      {
        method: "PATCH",
        body: { status: "approved" },
      },
    );
    return getOrder(orderId, true);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Rejects a submitted payment with an account-manager reason.
 * @param orderId Opaque order identifier.
 * @param reason Required rejection explanation.
 */
export async function rejectOrder(orderId: string, reason: string): Promise<OrderSummary> {
  const safeReason = reason.trim();
  if (!safeReason)
    throw new AppError({
      code: "VALIDATION_ERROR",
      status: 400,
      message_key: "errors:fieldInvalid",
    });
  try {
    if (apiMode === "mock") {
      const payload = await request(
        `${ADMIN_ORDERS_PATH}/${encodeURIComponent(orderId)}/reject`,
        unknownResponseSchema,
        {
          method: "POST",
          body: { reason: safeReason },
        },
      );
      return adaptOrder(dataFrom(payload), "mock");
    }
    await request(
      `${ORDER_APPROVAL_PATH}/${encodeURIComponent(orderId)}/review`,
      unknownResponseSchema,
      {
        method: "PATCH",
        body: { status: "rejected", reason: safeReason },
      },
    );
    return getOrder(orderId, true);
  } catch (error) {
    throw mappedError(error);
  }
}

/** Creates and approves a manual cash order where the target capability exists.
 * @param input Student, product, cash method, and optional sender reference.
 * @param idempotencyKey Stable key for this confirmation attempt.
 */
export async function createManualOrder(
  input: ManualOrderInput,
  idempotencyKey: string,
): Promise<OrderSummary> {
  const values = ManualOrderInputSchema.parse(input);
  if (apiMode === "live" && !capabilities.manualOrder)
    throw new AppError({
      code: "CAPABILITY_UNAVAILABLE",
      status: 501,
      message_key: "errors:capabilityUnavailable",
    });
  try {
    const payload = await request(`${ADMIN_ORDERS_PATH}/manual`, unknownResponseSchema, {
      method: "POST",
      body: values,
      ...(capabilities.idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : {}),
    });
    return adaptOrder(dataFrom(payload), apiMode);
  } catch (error) {
    throw mappedError(error);
  }
}

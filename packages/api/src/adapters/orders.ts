import { AppError } from "../errors/app-error";
import { OrderSummarySchema, type OrderSummary } from "../contracts/orders";

function invalidOrder(): AppError {
  return new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: 502,
    message_key: "errors:invalidResponse",
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) throw invalidOrder();
  return value as Record<string, unknown>;
}

function nestedRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function legacyStatus(value: unknown): OrderSummary["status"] {
  if (value === "pending_payment" || value === "pending_review") return "awaiting_payment";
  if (value === "approved") return "completed";
  if (value === "rejected" || value === "expired" || value === "cancelled") return value;
  throw invalidOrder();
}

function paymentDetails(value: unknown) {
  const payment = nestedRecord(value);
  if (!payment) return null;
  return {
    status: typeof payment.status === "string" ? payment.status : null,
    notes: typeof payment.notes === "string" ? payment.notes : null,
    createdAt: typeof payment.createdAt === "string" ? payment.createdAt : null,
  };
}

function orderProduct(source: Record<string, unknown>, product?: Record<string, unknown>) {
  return {
    id: source.productId ?? product?.id,
    name: source.productName ?? product?.name,
    type: source.productType === "package" || product?.type === "package" ? "package" : "lesson",
  } as const;
}

function orderTeacher(source: Record<string, unknown>) {
  const teacher = nestedRecord(source.teacher);
  return {
    id: source.teacherId ?? teacher?.id,
    name: typeof teacher?.name === "string" ? teacher.name : null,
  };
}

function orderStudent(student: Record<string, unknown> | undefined) {
  if (!student) return undefined;
  return {
    id: student.id,
    name: student.name,
    phone: typeof student.phone === "string" ? student.phone : null,
  };
}

function orderSnapshot(source: Record<string, unknown>) {
  return {
    fullPrice: source.fullPrice ?? source.salePrice,
    ...(typeof source.announcedLessonCount === "number"
      ? { announcedCount: source.announcedLessonCount }
      : {}),
    ...(typeof source.remainingLessonCount === "number"
      ? { remainingCount: source.remainingLessonCount }
      : {}),
    amount: source.salePrice,
  };
}

function readPaymentMetadata(notes: string | null) {
  if (!notes) return { paymentMethod: null, senderRef: null };
  try {
    const parsed: unknown = JSON.parse(notes);
    const record = nestedRecord(parsed);
    if (!record) return { paymentMethod: null, senderRef: notes };
    const method = record.paymentMethod;
    const sender = record.senderRef;
    return {
      paymentMethod:
        method === "instapay" || method === "wallet" || method === "cash" ? method : null,
      senderRef: typeof sender === "string" ? sender : null,
    };
  } catch {
    return { paymentMethod: null, senderRef: notes };
  }
}

function adaptLegacyOrder(value: unknown): OrderSummary {
  const source = asRecord(value);
  const payment = paymentDetails(source.payment);
  const paymentMetadata = readPaymentMetadata(payment?.notes ?? null);
  const student = nestedRecord(source.student);
  const approval = nestedRecord(source.approval);
  const product = nestedRecord(source.product);
  const adaptedStudent = orderStudent(student);
  const result = OrderSummarySchema.safeParse({
    id: source.id,
    orderNumber: source.orderNumber ?? source.referenceNumber,
    status: legacyStatus(source.status),
    priceSnapshot: orderSnapshot(source),
    paymentMethod: paymentMetadata.paymentMethod,
    senderRef: paymentMetadata.senderRef,
    expiresAt: typeof source.expiresAt === "string" ? source.expiresAt : null,
    createdAt: source.createdAt,
    ...(typeof source.serverNow === "string" ? { serverNow: source.serverNow } : {}),
    product: orderProduct(source, product),
    teacher: orderTeacher(source),
    ...(adaptedStudent ? { student: adaptedStudent } : {}),
    rejectionReason: typeof approval?.reason === "string" ? approval.reason : null,
    payment,
  });
  if (!result.success) throw invalidOrder();
  return result.data;
}

/** Maps legacy purchase and payment fields into the target order contract.
 * @param value Backend or mock order value.
 * @param mode Current transport mode; mock values already use the target schema.
 */
export function adaptOrder(value: unknown, mode: "mock" | "live"): OrderSummary {
  if (mode === "live") return adaptLegacyOrder(value);
  const parsed = OrderSummarySchema.safeParse(value);
  if (!parsed.success) throw invalidOrder();
  return parsed.data;
}

/** Converts identifiable legacy order conflicts to safe target error codes.
 * @param code Normalized transport error code.
 * @param details Safe error details captured by the HTTP client.
 * @returns Target order error code or the original code when no mapping is known.
 */
export function adaptOrderErrorCode(code: string, details: unknown): string {
  const message = nestedRecord(details)?.legacyMessage;
  const normalized = typeof message === "string" ? message.toLowerCase() : "";
  if (normalized.includes("already purchased")) return "PRODUCT_ALREADY_OWNED";
  if (normalized.includes("pending order") || normalized.includes("already open"))
    return "ORDER_ALREADY_OPEN";
  if (normalized.includes("not purchasable")) return "PRODUCT_NOT_PURCHASABLE";
  if (normalized.includes("already reviewed") || code === "ORDER_ALREADY_PROCESSED")
    return "ORDER_ALREADY_PROCESSED";
  return code;
}

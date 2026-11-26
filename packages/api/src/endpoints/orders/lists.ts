import { adaptOrder } from "../../adapters/orders";
import { capabilities } from "../../config/capabilities";
import { OrderListSchema, type OrderList, type OrderListQuery } from "../../contracts/orders";
import { AppError } from "../../errors/app-error";
import { apiMode } from "../../mocks/mode";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function dataFrom(payload: unknown): unknown {
  return isRecord(payload) && "data" in payload ? payload.data : payload;
}

function listItems(payload: unknown): unknown[] {
  const data = dataFrom(payload);
  if (Array.isArray(data)) return data;
  if (isRecord(data) && Array.isArray(data.items)) return data.items;
  throw new AppError({
    code: "RESPONSE_VALIDATION_FAILED",
    status: 502,
    message_key: "errors:invalidResponse",
  });
}

function pagination(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.pagination)) return undefined;
  return payload.pagination;
}

function paginationFields(payload: unknown, query: OrderListQuery, items: unknown[]) {
  const page = pagination(payload);
  const total = page?.total ?? (isRecord(payload) ? payload.count : undefined) ?? items.length;
  return {
    page: typeof page?.page === "number" ? page.page : query.page,
    pageSize: typeof page?.limit === "number" ? page.limit : query.pageSize,
    total: typeof total === "number" ? total : items.length,
  };
}

function serverTimestamp(payload: unknown): string | undefined {
  if (!isRecord(payload) || typeof payload.serverNow !== "string") return undefined;
  return payload.serverNow;
}

function legacyList(payload: unknown, query: OrderListQuery): OrderList {
  const items = listItems(payload).map((item) => adaptOrder(item, apiMode));
  const serverNow = serverTimestamp(payload);
  const parsed = OrderListSchema.safeParse({
    items,
    ...paginationFields(payload, query, items),
    ...(serverNow ? { serverNow } : {}),
  });
  if (!parsed.success)
    throw new AppError({
      code: "RESPONSE_VALIDATION_FAILED",
      status: 502,
      message_key: "errors:invalidResponse",
    });
  return parsed.data;
}

/** Normalizes target mock and legacy server order list envelopes.
 * @param payload Raw API response.
 * @param query Validated page request used as fallback for legacy responses.
 */
export function parseOrdersList(payload: unknown, query: OrderListQuery): OrderList {
  if (apiMode === "mock") {
    const parsed = OrderListSchema.safeParse(dataFrom(payload));
    if (parsed.success) return parsed.data;
  }
  return legacyList(payload, query);
}

function appendSupportedFilters(params: URLSearchParams, query: OrderListQuery): void {
  const supportsFilters = apiMode === "mock" || capabilities.orderAdminFilters;
  const optionalParams: Array<[string, string | undefined]> = [
    ["status", query.status],
    ["q", supportsFilters ? query.search : undefined],
    ["teacherId", supportsFilters ? query.teacherId : undefined],
    ["from", supportsFilters ? query.from : undefined],
    ["to", supportsFilters ? query.to : undefined],
    ["expiringSoon", supportsFilters && query.expiringSoon ? "true" : undefined],
  ];
  optionalParams.forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
}

function mapLegacyFilters(params: URLSearchParams, query: OrderListQuery): void {
  params.set("limit", String(query.pageSize));
  params.delete("pageSize");
  if (query.status === "completed") params.set("status", "approved");
  if (
    query.status === "awaiting_payment" ||
    query.status === "closed" ||
    query.status === "expired" ||
    query.status === "cancelled"
  )
    params.delete("status");
}

/** Builds a list query string using only filters supported by the active API mode.
 * @param query Validated list state.
 */
export function buildOrdersListQuery(query: OrderListQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  appendSupportedFilters(params, query);
  if (apiMode === "live") mapLegacyFilters(params, query);
  return `?${params.toString()}`;
}

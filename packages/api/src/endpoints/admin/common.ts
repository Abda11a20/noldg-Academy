import { AppError } from "../../errors/app-error";
import { apiMode } from "../../mocks/mode";
import type { ListUrlState } from "../../contracts/common";

/** Reports whether a backend capability is available in the selected mode.
 * @param available Capability availability.
 * @throws AppError when the current backend cannot support the operation.
 */
export function requireCapability(available: boolean): void {
  if (available) return;
  throw new AppError({
    code: "CAPABILITY_UNAVAILABLE",
    status: 501,
    message_key: "errors:capabilityUnavailable",
  });
}

/** Builds normalized list request query parameters for mock and legacy APIs.
 * @param path Endpoint path without query string.
 * @param state Validated URL list state.
 * @param filters Active endpoint filters.
 * @param includePagination Whether to include page and page size.
 * @param supportsSearch Whether the endpoint accepts search and sort.
 * @returns Endpoint path with encoded query parameters.
 */
export function listPath(
  path: string,
  state: ListUrlState,
  filters: Record<string, string>,
  includePagination: boolean,
  supportsSearch: boolean,
): string {
  const params = new URLSearchParams(filters);
  if (includePagination) {
    params.set("page", String(state.page));
    params.set(apiMode === "mock" ? "pageSize" : "limit", String(state.pageSize));
  }
  if (supportsSearch && state.search) params.set("q", state.search);
  if (supportsSearch && state.sort) params.set("sort", state.sort);
  return `${path}?${params.toString()}`;
}

/** Normalizes a list payload into the target pagination envelope.
 * @param payload Backend response payload.
 * @param parser Converts one legacy record into its target shape.
 * @param state Validated URL list state.
 * @returns Target list envelope.
 */
export function parseTargetList<T>(
  payload: unknown,
  parser: (value: unknown) => T,
  state: ListUrlState,
) {
  if (apiMode === "mock")
    return payload as { items: T[]; page: number; pageSize: number; total: number };
  const response = payload as {
    data?: unknown;
    pagination?: { page: number; limit: number; total: number };
  };
  const data = Array.isArray(response.data) ? response.data : [];
  const records = data.map(parser);
  if (response.pagination) {
    return {
      items: records,
      page: response.pagination.page,
      pageSize: response.pagination.limit,
      total: response.pagination.total,
    };
  }
  // Legacy callers request complete lists; slicing is valid only when the server did not paginate.
  const start = (state.page - 1) * state.pageSize;
  return {
    items: records.slice(start, start + state.pageSize),
    page: state.page,
    pageSize: state.pageSize,
    total: records.length,
  };
}

/** Legacy academic system names mapped to target values. */
export const legacySystems: Record<string, string> = {
  azhar: "al_azhar",
  egyptian_bacc: "egyptian_baccalaureate",
};

/** Legacy academic stage names mapped to target values. */
export const legacyStages: Record<string, string> = { prep: "preparatory" };

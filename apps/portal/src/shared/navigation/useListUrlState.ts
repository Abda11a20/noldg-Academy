import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { ListUrlStateSchema, type ListUrlState } from "@noldg/api/contracts/common";
import {
  DEFAULT_LIST_PAGE,
  DEFAULT_LIST_PAGE_SIZE,
  LIST_SEARCH_DEBOUNCE_MS,
  LIST_URL_KEYS,
} from "./list-url-constants";

function readState(params: URLSearchParams): ListUrlState {
  let filters: Record<string, string> = {};
  try {
    const rawFilters = params.get(LIST_URL_KEYS.filters);
    if (rawFilters) filters = JSON.parse(rawFilters) as Record<string, string>;
  } catch {
    filters = {};
  }
  const parsed = ListUrlStateSchema.safeParse({
    page: Number(params.get(LIST_URL_KEYS.page) ?? DEFAULT_LIST_PAGE),
    pageSize: Number(params.get(LIST_URL_KEYS.pageSize) ?? DEFAULT_LIST_PAGE_SIZE),
    search: params.get(LIST_URL_KEYS.search) ?? "",
    ...(params.get(LIST_URL_KEYS.sort) ? { sort: params.get(LIST_URL_KEYS.sort) } : {}),
    filters,
  });
  return parsed.success
    ? parsed.data
    : { page: DEFAULT_LIST_PAGE, pageSize: DEFAULT_LIST_PAGE_SIZE, search: "", filters: {} };
}

/** Synchronizes paginated list controls with shareable URL parameters and browser history.
 * @returns Validated state and focused setters; invalid parameters fall back to defaults.
 */
export function useListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => readState(searchParams), [searchParams]);
  const searchTimer = useRef<number | undefined>(undefined);
  const update = useCallback(
    (patch: Partial<ListUrlState>, replace = false) => {
      const next = { ...state, ...patch };
      const validated = ListUrlStateSchema.safeParse(next);
      if (!validated.success) return;
      const params = new URLSearchParams(searchParams);
      params.set(LIST_URL_KEYS.page, String(validated.data.page));
      params.set(LIST_URL_KEYS.pageSize, String(validated.data.pageSize));
      if (validated.data.search) params.set(LIST_URL_KEYS.search, validated.data.search);
      else params.delete(LIST_URL_KEYS.search);
      if (validated.data.sort) params.set(LIST_URL_KEYS.sort, validated.data.sort);
      else params.delete(LIST_URL_KEYS.sort);
      if (Object.keys(validated.data.filters).length)
        params.set(LIST_URL_KEYS.filters, JSON.stringify(validated.data.filters));
      else params.delete(LIST_URL_KEYS.filters);
      setSearchParams(params, { replace });
    },
    [searchParams, setSearchParams, state],
  );
  const setSearch = useCallback(
    (search: string) => {
      window.clearTimeout(searchTimer.current);
      searchTimer.current = window.setTimeout(
        () => update({ search, page: DEFAULT_LIST_PAGE }, true),
        LIST_SEARCH_DEBOUNCE_MS,
      );
    },
    [update],
  );
  useEffect(() => () => window.clearTimeout(searchTimer.current), [searchParams]);
  return {
    state,
    searchKey: searchParams.toString(),
    setPage: (page: number) => update({ page }),
    setPageSize: (pageSize: number) => update({ pageSize, page: DEFAULT_LIST_PAGE }),
    setSearch,
    setFilters: (filters: Record<string, string>) => update({ filters, page: DEFAULT_LIST_PAGE }),
    setSort: (sort?: string) => update({ sort }),
  };
}

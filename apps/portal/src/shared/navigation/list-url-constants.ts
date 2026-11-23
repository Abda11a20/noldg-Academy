export const LIST_URL_KEYS = {
  page: "page",
  pageSize: "pageSize",
  search: "q",
  sort: "sort",
  filters: "filters",
} as const;
export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_PAGE_SIZE = 20;
export const LIST_SEARCH_DEBOUNCE_MS = 300;

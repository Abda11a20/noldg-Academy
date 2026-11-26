export const CATALOG_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const COURSE_LOOKUP_PAGE_SIZE = 100;
export const DEFAULT_UPLOAD_LIMITS = {
  videoBytes: 256 * 1024 * 1024,
  attachmentBytes: 25 * 1024 * 1024,
  largeVideoWarningBytes: 100 * 1024 * 1024,
} as const;
export const ATTACHMENT_COUNT_LIMIT = 10;

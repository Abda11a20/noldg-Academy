import { z } from "zod";

/** Pagination values shared by list endpoints. */
export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
});

/** URL-backed list state shared by paginated portal screens. */
export const ListUrlStateSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  search: z.string(),
  sort: z.string().optional(),
  filters: z.record(z.string(), z.string()),
});
export type ListUrlState = z.infer<typeof ListUrlStateSchema>;

/** A non-empty identifier that permits UUIDs and existing backend identifiers. */
export const IdSchema = z.string().trim().min(1);

/** Monetary value that preserves current whole-EGP and decimal ledger values. */
export const MoneySchema = z.union([
  z.number().int().nonnegative(),
  z.string().regex(/^\d+(\.\d{1,2})?$/),
]);

/** Three-letter currency code used by monetary contracts. */
export const CurrencySchema = z.literal("EGP");

/** ISO 8601 timestamp with an explicit UTC offset. */
export const IsoTimestampSchema = z.string().datetime({ offset: true });

/** The normalized error fields understood by the HTTP client. */
export const ErrorEnvelopeSchema = z.object({
  success: z.literal(false).optional(),
  code: z.string().optional(),
  message_key: z.string().optional(),
  message: z.string().optional(),
  details: z.unknown().optional(),
  error: z
    .object({
      code: z.string().optional(),
      message: z.string().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;
export type Id = z.infer<typeof IdSchema>;
export type Money = z.infer<typeof MoneySchema>;

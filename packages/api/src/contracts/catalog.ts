import { z } from "zod";
import { HttpsUrlSchema, IdSchema, IsoTimestampSchema, MoneySchema } from "./common";

export const MIN_CATALOG_PRICE_EGP = 1;
export const MAX_CATALOG_PRICE_EGP = 2_147_483_647;
export const MINIMUM_ANNOUNCED_LESSON_COUNT = 1;
export const CatalogPriceSchema = z
  .number()
  .int()
  .min(MIN_CATALOG_PRICE_EGP)
  .max(MAX_CATALOG_PRICE_EGP);

export const CatalogCourseSchema = z.object({
  id: IdSchema,
  subject: z.object({ id: IdSchema, name: z.string() }),
  track: z.object({
    id: IdSchema,
    name: z.string(),
    system: z.string(),
    stage: z.string(),
    grade: z.number().int(),
  }),
  lessonCount: z.number().int().nonnegative().optional(),
  packageCount: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const CatalogLessonSchema = z.object({
  id: IdSchema,
  courseId: IdSchema,
  title: z.string(),
  description: z.string(),
  kind: z.enum(["recorded", "live"]),
  status: z.enum(["draft", "published", "archived"]),
  availableFrom: IsoTimestampSchema,
  availableUntil: IsoTimestampSchema,
  access: z.enum(["free", "paid"]),
  price: CatalogPriceSchema.optional(),
  currentStudentPrice: CatalogPriceSchema.optional(),
  videoState: z.enum(["none", "uploading", "processing", "ready", "failed"]),
  video: z
    .object({
      publicId: z.string(),
      format: z.string(),
      duration: z.number().nonnegative().optional(),
    })
    .optional(),
  attachments: z.array(z.object({ publicId: z.string(), name: z.string(), format: z.string() })),
  startLocked: z.boolean().default(false),
  minimumAllowedEnd: IsoTimestampSchema.optional(),
});

export const CatalogProductSchema = z.object({
  id: IdSchema,
  courseId: IdSchema,
  type: z.enum(["lesson", "package"]),
  name: z.string(),
  price: CatalogPriceSchema,
  lessonId: IdSchema.optional(),
  announcedLessonCount: z.number().int().min(MINIMUM_ANNOUNCED_LESSON_COUNT).optional(),
  lessonIds: z.array(IdSchema).optional(),
  status: z.enum(["active", "archived"]),
});

export const CourseListSchema = z.object({
  items: z.array(CatalogCourseSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const LessonListSchema = z.object({
  items: z.array(CatalogLessonSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});

export const ProductPricingSchema = z.object({
  fullPrice: CatalogPriceSchema,
  currentPrice: CatalogPriceSchema,
  announcedLessonCount: z.number().int().min(MINIMUM_ANNOUNCED_LESSON_COUNT),
  remainingLessonCount: z.number().int().nonnegative(),
  commissionPercentage: z.number().nonnegative(),
  platformAmount: z.union([MoneySchema, z.number().nonnegative()]),
  teacherAmount: z.union([MoneySchema, z.number().nonnegative()]),
  isPurchasable: z.boolean(),
});

export const ProductListSchema = z.array(
  z.object({ product: CatalogProductSchema, pricing: ProductPricingSchema }),
);

export const UploadTicketSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("form-post"),
    url: HttpsUrlSchema,
    fields: z.record(z.string(), z.string()),
    uploadToken: z.string().min(1),
    expiresAt: IsoTimestampSchema.optional(),
  }),
  z.object({
    method: z.literal("tus"),
    url: HttpsUrlSchema,
    headers: z.record(z.string(), z.string()),
    uploadToken: z.string().min(1),
    expiresAt: IsoTimestampSchema.optional(),
  }),
]);

export const CourseListQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  search: z.string(),
});

export const LessonInputSchema = z.object({
  title: z.string().trim().min(1).max(150),
  description: z.string().max(5000),
  kind: z.enum(["recorded", "live"]),
  status: z.enum(["draft", "published", "archived"]).optional(),
  availableFrom: IsoTimestampSchema,
  availableUntil: IsoTimestampSchema,
  access: z.enum(["free", "paid"]),
  price: CatalogPriceSchema.optional(),
  videoUploadToken: z.string().optional(),
  attachmentUploadTokens: z.array(z.string()).optional(),
});

export const ProductInputSchema = z.object({
  courseId: IdSchema,
  name: z.string().trim().min(1),
  price: CatalogPriceSchema,
  announcedLessonCount: z.number().int().min(MINIMUM_ANNOUNCED_LESSON_COUNT),
  lessonIds: z.array(IdSchema),
  status: z.enum(["active", "archived"]).optional(),
});

export const ProductInputWithLessonLimitSchema = ProductInputSchema.superRefine(
  (value, context) => {
    if (value.lessonIds.length > value.announcedLessonCount) {
      context.addIssue({
        code: "custom",
        path: ["lessonIds"],
        message: "catalog:bundleLessonLimit",
      });
    }
  },
);

export type CatalogCourse = z.infer<typeof CatalogCourseSchema>;
export type CatalogLesson = z.infer<typeof CatalogLessonSchema>;
export type CatalogProduct = z.infer<typeof CatalogProductSchema>;
export type ProductPricing = z.infer<typeof ProductPricingSchema>;
export type UploadTicket = z.infer<typeof UploadTicketSchema>;
export type LessonInput = z.infer<typeof LessonInputSchema>;
export type ProductInput = z.infer<typeof ProductInputSchema>;

import { z } from "zod";
import { IdSchema, IsoTimestampSchema } from "./common";

export const BrowseAvailabilitySchema = z.enum(["upcoming", "available", "ended"]);
export const BrowseAccessSchema = z.enum(["free", "paid"]);
export const BrowseSortSchema = z.enum(["rating", "newest", "priceAsc", "priceDesc"]);

export const BrowseSubjectSchema = z.object({
  id: IdSchema,
  name: z.string(),
  nameAr: z.string().optional(),
});
export const BrowseTrackSchema = z.object({
  id: IdSchema,
  name: z.string(),
  system: z.string(),
  stage: z.string(),
  grade: z.number().int(),
});

const HttpsUrlOrEmptySchema = z.string().refine(
  (value) => {
    if (value === "") return true;
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "must be an https URL" },
);

export const BrowseTeacherSchema = z.object({
  id: IdSchema,
  name: z.string(),
  nameAr: z.string().optional(),
  photoUrl: HttpsUrlOrEmptySchema.nullable(),
  bioExcerpt: z.string(),
  bioExcerptAr: z.string().optional(),
  subjects: z.array(BrowseSubjectSchema),
  ratingAverage: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative(),
  startingPrice: z.number().int().nonnegative().nullable(),
  hasFreeLessons: z.boolean(),
  createdAt: IsoTimestampSchema,
});

export const BrowseTeacherListSchema = z.object({
  items: z.array(BrowseTeacherSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  serverNow: IsoTimestampSchema.optional(),
});

export const BrowseLessonSchema = z.object({
  id: IdSchema,
  title: z.string(),
  availableFrom: IsoTimestampSchema,
  availableUntil: IsoTimestampSchema,
  availability: BrowseAvailabilitySchema,
  access: BrowseAccessSchema,
});

export const BrowsePricingSchema = z.object({
  priceNow: z.number().int().nonnegative(),
  announcedCount: z.number().int().positive(),
  remainingCount: z.number().int().nonnegative().optional(),
  purchasable: z.boolean(),
});

export const BrowseProductSchema = z.object({
  id: IdSchema,
  name: z.string(),
  kind: z.enum(["lesson", "bundle"]),
  lessonId: IdSchema.optional(),
  pricing: BrowsePricingSchema,
});

export const BrowseCourseSchema = z.object({
  id: IdSchema,
  subject: BrowseSubjectSchema,
  track: BrowseTrackSchema,
  lessons: z.array(BrowseLessonSchema),
  products: z.array(BrowseProductSchema),
});

export const BrowseTeacherDetailSchema = BrowseTeacherSchema.extend({
  bio: z.string(),
  bioAr: z.string().optional(),
  courses: z.array(BrowseCourseSchema),
  serverNow: IsoTimestampSchema.optional(),
});

export const BrowseTeacherQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  q: z.string(),
  trackId: z.string().optional(),
  subjectId: z.string().optional(),
  minRating: z.number().min(0).max(5).optional(),
  hasFreeLessons: z.boolean().optional(),
  sort: BrowseSortSchema,
});

export type BrowseTeacher = z.infer<typeof BrowseTeacherSchema>;
export type BrowseTeacherList = z.infer<typeof BrowseTeacherListSchema>;
export type BrowseLesson = z.infer<typeof BrowseLessonSchema>;
export type BrowseProduct = z.infer<typeof BrowseProductSchema>;
export type BrowseCourse = z.infer<typeof BrowseCourseSchema>;
export type BrowseTeacherDetail = z.infer<typeof BrowseTeacherDetailSchema>;
export type BrowseTeacherQuery = z.infer<typeof BrowseTeacherQuerySchema>;

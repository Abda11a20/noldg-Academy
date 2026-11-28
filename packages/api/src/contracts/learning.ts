import { z } from "zod";
import { HttpsUrlSchema, IdSchema, IsoTimestampSchema } from "./common";

export const LessonAvailabilitySchema = z.enum(["available", "upcoming", "ended"]);
export const LessonAccessSchema = z.enum(["free", "owned", "not_owned"]);
export const PlaybackSourceSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("file"), url: HttpsUrlSchema, expiresAt: IsoTimestampSchema }),
  z.object({ method: z.literal("hls"), url: HttpsUrlSchema, expiresAt: IsoTimestampSchema }),
]);
export const LessonProgressSchema = z.object({
  watchedPercent: z.number().min(0).max(100),
  thresholdReached: z.boolean(),
  lastPositionSeconds: z.number().nonnegative(),
});
export const LearningAttachmentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  size: z.number().nonnegative(),
  type: z.string(),
});
export const StudentLessonSchema = z.object({
  id: IdSchema,
  title: z.string(),
  description: z.string(),
  teacher: z.object({ id: IdSchema, name: z.string() }),
  course: z.object({ id: IdSchema, name: z.string() }),
  availableFrom: IsoTimestampSchema,
  availableUntil: IsoTimestampSchema,
  availability: LessonAvailabilitySchema,
  serverNow: IsoTimestampSchema,
  access: LessonAccessSchema,
  productId: IdSchema.optional(),
  progress: LessonProgressSchema,
  attachments: z.array(LearningAttachmentSchema),
  quiz: z.object({ available: z.boolean(), id: IdSchema.optional() }),
  prerequisiteLessonId: IdSchema.nullable(),
});
export const StudentLessonListSchema = z.object({
  items: z.array(StudentLessonSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  serverNow: IsoTimestampSchema,
});
export const MyLessonsQuerySchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  availability: LessonAvailabilitySchema.optional(),
  teacherId: IdSchema.optional(),
  courseId: IdSchema.optional(),
  search: z.string().optional(),
  sort: z.literal("availableUntil").optional(),
});
export const StartPlaybackInputSchema = z.object({ lessonId: IdSchema });
export const PlaybackSessionSchema = z.object({
  sessionId: IdSchema,
  source: PlaybackSourceSchema,
  startPositionSeconds: z.number().nonnegative(),
  heartbeatIntervalSeconds: z.number().int().positive(),
  watermark: z.object({ text: z.string() }),
  serverNow: IsoTimestampSchema,
});
export const PlaybackHeartbeatInputSchema = z.object({
  sequence: z.number().int().positive(),
  positionSeconds: z.number().nonnegative(),
  playbackRate: z.number().min(0.25).max(2),
  isPlaying: z.boolean(),
});
export const PlaybackHeartbeatSchema = z.object({
  watchedSeconds: z.number().nonnegative(),
  watchedPercent: z.number().min(0).max(100),
  thresholdReached: z.boolean(),
  nextHeartbeatInSeconds: z.number().int().positive(),
  serverNow: IsoTimestampSchema,
});
export const LegacyPlaybackStartedSchema = z.object({
  session: z.object({
    id: IdSchema,
    lastPosition: z.number().nonnegative().optional(),
    lastHeartbeatAt: IsoTimestampSchema.optional(),
    createdAt: IsoTimestampSchema.optional(),
  }),
  heartbeatIntervalSeconds: z.number().int().positive().optional(),
});
export const LegacyPlaybackAccessSchema = z.object({
  video: z.object({ url: HttpsUrlSchema }),
  mediaExpiresAt: IsoTimestampSchema,
});
export const LegacyHeartbeatResponseSchema = z.object({
  progress: z.object({
    watchedSeconds: z.number().nonnegative(),
    watchedPercentage: z.number().min(0).max(100),
    completed: z.boolean(),
  }),
  serverNow: IsoTimestampSchema.optional(),
});
export const LegacyLessonProgressSchema = z.object({
  watchedPercentage: z.number().min(0).max(100),
  lastPosition: z.number().nonnegative(),
  completed: z.boolean(),
});

export type StudentLesson = z.infer<typeof StudentLessonSchema>;
export type LessonAvailability = z.infer<typeof LessonAvailabilitySchema>;
export type StudentLessonList = z.infer<typeof StudentLessonListSchema>;
export type MyLessonsQuery = z.infer<typeof MyLessonsQuerySchema>;
export type PlaybackSession = z.infer<typeof PlaybackSessionSchema>;
export type PlaybackHeartbeatInput = z.infer<typeof PlaybackHeartbeatInputSchema>;
export type PlaybackHeartbeat = z.infer<typeof PlaybackHeartbeatSchema>;

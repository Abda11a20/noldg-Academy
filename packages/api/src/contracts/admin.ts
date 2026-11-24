import { z } from "zod";
import { IdSchema, ListUrlStateSchema } from "./common";
import {
  ACADEMIC_GRADES,
  ACADEMIC_STAGES,
  ACADEMIC_SYSTEMS,
  ADMIN_REASON_MIN_LENGTH,
  AMERICAN_DIPLOMA_SYSTEM,
  SECONDARY_STAGE,
} from "../constants/admin";

export const AcademicSystemSchema = z.enum(ACADEMIC_SYSTEMS);
export const AcademicStageSchema = z.enum(ACADEMIC_STAGES);
export const AccountStatusSchema = z.enum(["active", "suspended"]);
const AcademicGradeSchema = z
  .number()
  .int()
  .refine((grade) => ACADEMIC_GRADES.includes(grade as (typeof ACADEMIC_GRADES)[number]));
export const AcademicTrackSchema = z.object({
  id: IdSchema,
  system: AcademicSystemSchema,
  stage: AcademicStageSchema,
  grade: AcademicGradeSchema,
  name: z.string().min(1),
  active: z.boolean(),
});
export const AcademicSubjectSchema = z.object({
  id: IdSchema,
  name: z.string().min(1),
  active: z.boolean(),
});
export const ListEnvelopeSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  });
export const TrackListSchema = ListEnvelopeSchema(AcademicTrackSchema);
export const SubjectListSchema = ListEnvelopeSchema(AcademicSubjectSchema);
const TrackFieldsSchema = AcademicTrackSchema.pick({
  system: true,
  stage: true,
  grade: true,
  name: true,
});
export const TrackInputSchema = TrackFieldsSchema.superRefine((track, context) => {
  if (track.system === AMERICAN_DIPLOMA_SYSTEM && track.stage !== SECONDARY_STAGE)
    context.addIssue({
      code: "custom",
      path: ["stage"],
      message: "american_diploma_secondary_only",
    });
});
export const TrackUpdateSchema = TrackFieldsSchema.partial()
  .extend({ active: z.boolean().optional() })
  .superRefine((track, context) => {
    if (track.system === AMERICAN_DIPLOMA_SYSTEM && track.stage === "prep")
      context.addIssue({
        code: "custom",
        path: ["stage"],
        message: "american_diploma_secondary_only",
      });
  });
export const SubjectInputSchema = AcademicSubjectSchema.pick({ name: true });
export const SubjectUpdateSchema = SubjectInputSchema.partial().extend({
  active: z.boolean().optional(),
});
export const TeacherReviewSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("approved") }),
  z.object({
    status: z.literal("rejected"),
    reason: z.string().trim().min(ADMIN_REASON_MIN_LENGTH),
  }),
]);
export const AccountStatusUpdateSchema = z.object({
  status: AccountStatusSchema,
  reason: z.string().trim().min(ADMIN_REASON_MIN_LENGTH),
});
export const TrackSubjectSchema = z.object({ id: IdSchema, name: z.string(), active: z.boolean() });
export const OfferingSchema = z.object({
  trackId: IdSchema,
  subjectId: IdSchema,
  track: AcademicTrackSchema.optional(),
  subject: AcademicSubjectSchema.optional(),
});
export const TeacherResubmissionSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  bio: z.string().trim().min(1),
  offerings: z.array(OfferingSchema.pick({ trackId: true, subjectId: true })).min(1),
});
export const TeacherApplicationSchema = z.object({
  id: IdSchema,
  userId: z.object({
    id: IdSchema,
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  bio: z.string(),
  imageUrl: z.string().url().optional(),
  status: z.enum(["pending", "approved", "rejected"]),
  rejectionReason: z.string().optional(),
  submittedAt: z.string(),
  reviewedAt: z.string().optional(),
  statusHistory: z
    .array(
      z.object({
        status: z.enum(["pending", "approved", "rejected"]),
        occurredAt: z.string(),
        reason: z.string().optional(),
      }),
    )
    .default([]),
  offerings: z.array(OfferingSchema),
});
export const TeacherApplicationListSchema = ListEnvelopeSchema(TeacherApplicationSchema);
export const UserSummarySchema = z.object({
  id: IdSchema,
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: AccountStatusSchema,
});
export const UserListSchema = ListEnvelopeSchema(UserSummarySchema);
export const AdminListQuerySchema = ListUrlStateSchema.extend({
  filters: z.record(z.string(), z.string()),
});

export type AcademicSystem = z.infer<typeof AcademicSystemSchema>;
export type AcademicStage = z.infer<typeof AcademicStageSchema>;
export type AcademicTrack = z.infer<typeof AcademicTrackSchema>;
export type AcademicSubject = z.infer<typeof AcademicSubjectSchema>;
export type TeacherApplication = z.infer<typeof TeacherApplicationSchema>;
export type AccountStatus = z.infer<typeof AccountStatusSchema>;
export type UserSummary = z.infer<typeof UserSummarySchema>;

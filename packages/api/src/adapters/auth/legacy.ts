import { z } from "zod";
import { AUTH_DEFAULT_ACCESS_TOKEN_SECONDS } from "../../constants/auth";
import { AuthUserSchema, type AuthUser } from "../../contracts/auth";

const LegacyUserSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    name: z.string(),
    email: z.string().email(),
    roles: z.string().optional(),
    role: z.string().optional(),
    status: z.enum(["active", "suspended"]).optional(),
    isVerified: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    trackId: z.string().optional(),
  })
  .passthrough();

export const LegacyLoginResponseSchema = z.object({
  success: z.literal(true),
  token: z.string().min(1),
});
export const LegacyProfileResponseSchema = z.object({
  success: z.literal(true),
  data: LegacyUserSchema,
});
export const LegacyActionResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
});
export const LegacyTeacherSignupResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({ id: z.string().optional(), _id: z.string().optional() }).passthrough(),
    application: z
      .object({ approvalStatus: z.enum(["pending", "approved", "rejected"]) })
      .passthrough(),
  }),
});
export const LegacyTeacherApplicationResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      approvalStatus: z.enum(["pending", "approved", "rejected"]),
      rejectionReason: z.string().optional(),
    })
    .passthrough(),
});

function createLegacyUserResult(user: z.infer<typeof LegacyUserSchema>) {
  return {
    id: user.id ?? user._id ?? "",
    name: user.name,
    email: user.email,
    role: user.role ?? user.roles ?? "student",
    status: user.status ?? "active",
    emailVerified: user.emailVerified ?? user.isVerified ?? true,
    ...(user.trackId ? { trackId: user.trackId } : {}),
  };
}

function addTeacherApplication(
  result: ReturnType<typeof createLegacyUserResult>,
  application: unknown,
) {
  const parsed = LegacyTeacherApplicationResponseSchema.safeParse(application);
  if (!parsed.success) return result;
  const applicationData = parsed.data.data;
  return {
    ...result,
    applicationStatus: applicationData.approvalStatus,
    ...(applicationData.rejectionReason
      ? { rejectionReason: applicationData.rejectionReason }
      : {}),
  };
}

/** Maps the legacy profile fields and teacher review status into the target user contract. */
export function adaptLegacyUser(value: unknown, application?: unknown): AuthUser {
  const user = LegacyUserSchema.parse(value);
  const result =
    application === undefined
      ? createLegacyUserResult(user)
      : addTeacherApplication(createLegacyUserResult(user), application);
  return AuthUserSchema.parse(result);
}

/** Supplies the current backend's configured default lifetime when the response omits it. */
export function legacyLoginExpirySeconds(): number {
  return AUTH_DEFAULT_ACCESS_TOKEN_SECONDS;
}

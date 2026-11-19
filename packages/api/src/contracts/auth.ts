import { z } from "zod";
import {
  AUTH_ERROR_CODES,
  AUTH_OTP_LENGTH,
  AUTH_PASSWORD_MAX_BYTES,
  AUTH_PASSWORD_MIN_LENGTH,
} from "../constants/auth";

export const AuthPasswordSchema = z
  .string()
  .min(AUTH_PASSWORD_MIN_LENGTH)
  .superRefine((password, context) => {
    if (new TextEncoder().encode(password).length > AUTH_PASSWORD_MAX_BYTES) {
      context.addIssue({ code: "custom", message: "password_too_long" });
    }
    if (!/[A-Z]/.test(password))
      context.addIssue({ code: "custom", message: "password_uppercase" });
    if (!/[a-z]/.test(password))
      context.addIssue({ code: "custom", message: "password_lowercase" });
    if (!/[0-9]/.test(password)) context.addIssue({ code: "custom", message: "password_number" });
    if (!/[#?!@$%^&*-]/.test(password))
      context.addIssue({ code: "custom", message: "password_symbol" });
  });
export const LoginPasswordSchema = z.string().superRefine((password, context) => {
  if (new TextEncoder().encode(password).length > AUTH_PASSWORD_MAX_BYTES) {
    context.addIssue({ code: "custom", message: "password_too_long" });
  }
});

const emailSchema = z.string().trim().email().max(320);
const phoneSchema = z.string().trim().min(1).max(64);
const otpSchema = z.string().regex(new RegExp(`^\\d{${AUTH_OTP_LENGTH}}$`));
const offeringSchema = z.object({
  trackId: z.string().trim().min(1),
  subjectId: z.string().trim().min(1),
});

export const AuthRoleSchema = z.enum(["student", "teacher", "admin", "super_admin"]);
export const AuthStatusSchema = z.enum(["active", "suspended"]);
export const TeacherApplicationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const AuthErrorCodeSchema = z.enum(AUTH_ERROR_CODES);

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: AuthRoleSchema,
  status: AuthStatusSchema,
  email: emailSchema,
  emailVerified: z.boolean(),
  trackId: z.string().optional(),
  applicationStatus: TeacherApplicationStatusSchema.optional(),
  rejectionReason: z.string().optional(),
});

export const LoginRequestSchema = z.object({ email: emailSchema, password: LoginPasswordSchema });
export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
  user: AuthUserSchema,
});
export const StudentRegistrationRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  phone: phoneSchema,
  parentPhone: phoneSchema,
  password: AuthPasswordSchema,
  trackId: z.string().trim().min(1),
  acceptTerms: z.literal(true),
});
export const StudentRegistrationResponseSchema = z.object({
  emailVerificationRequired: z.boolean(),
  userId: z.string().optional(),
});
export const TeacherRegistrationRequestSchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: emailSchema,
  phone: phoneSchema,
  password: AuthPasswordSchema,
  bio: z.string().trim().min(1).max(1000),
  offerings: z.array(offeringSchema).min(1),
  image: z.custom<File>((file) => typeof File !== "undefined" && file instanceof File),
  acceptTerms: z.literal(true),
});
export const TeacherRegistrationResponseSchema = z.object({
  userId: z.string().optional(),
  applicationStatus: TeacherApplicationStatusSchema,
  emailVerificationRequired: z.boolean(),
});
export const EmailCodeRequestSchema = z.object({ email: emailSchema, code: otpSchema });
export const ResendCodeRequestSchema = z.object({ email: emailSchema });
export const ForgotPasswordRequestSchema = z.object({ email: emailSchema });
export const ResetPasswordRequestSchema = z.object({
  email: emailSchema,
  code: otpSchema,
  password: AuthPasswordSchema,
});
export const AuthMessageResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  remainingAttempts: z.number().int().nonnegative().optional(),
  retryAfterSeconds: z.number().int().positive().optional(),
  emailVerificationRequired: z.boolean().optional(),
});
export const AuthUserResponseSchema = z.object({ user: AuthUserSchema });
export const LogoutResponseSchema = z.undefined();
export const AcademicCatalogSchema = z.object({
  systems: z.array(z.string()),
  tracks: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      system: z.string().min(1),
      stage: z.string().min(1),
      grade: z.number().int(),
      subjects: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
    }),
  ),
});
export const DeviceChangeRequestSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
export const DeviceChangeResponseSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "approved", "rejected"]),
  reason: z.string().optional(),
});

export type AuthErrorCode = z.infer<typeof AuthErrorCodeSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type StudentRegistrationRequest = z.infer<typeof StudentRegistrationRequestSchema>;
export type TeacherRegistrationRequest = z.infer<typeof TeacherRegistrationRequestSchema>;
export type AcademicCatalog = z.infer<typeof AcademicCatalogSchema>;
export type AcademicTrack = AcademicCatalog["tracks"][number];

import { z } from "zod";
import { apiMode } from "../../mocks/mode";
import { capabilities } from "../../config/capabilities";
import { request } from "../../http/client";
import { tokenStore } from "../../auth/token-store";
import { AppError } from "../../errors/app-error";
import {
  AcademicCatalogSchema,
  AuthMessageResponseSchema,
  AuthUserSchema,
  DeviceChangeRequestSchema,
  DeviceChangeResponseSchema,
  EmailCodeRequestSchema,
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  LogoutResponseSchema,
  ResendCodeRequestSchema,
  ResetPasswordRequestSchema,
  StudentRegistrationRequestSchema,
  StudentRegistrationResponseSchema,
  TeacherRegistrationRequestSchema,
  TeacherRegistrationResponseSchema,
  type AcademicCatalog,
  type AuthUser,
  type LoginRequest,
  type LoginResponse,
  type StudentRegistrationRequest,
  type TeacherRegistrationRequest,
} from "../../contracts/auth";
import { adaptCurrentAuthError, createCapabilityError } from "../../adapters/auth/errors";
import {
  adaptLegacyUser,
  LegacyActionResponseSchema,
  LegacyLoginResponseSchema,
  LegacyProfileResponseSchema,
  LegacyTeacherApplicationResponseSchema,
  LegacyTeacherSignupResponseSchema,
  legacyLoginExpirySeconds,
} from "../../adapters/auth/legacy";

const LegacyRegistrationResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({ id: z.string().optional(), _id: z.string().optional() })
    .passthrough()
    .optional(),
});
const AccessTokenResponseSchema = z.object({ accessToken: z.string().min(1) });
const LegacyStudentRegistrationRequestSchema = StudentRegistrationRequestSchema.pick({
  name: true,
  email: true,
  phone: true,
  password: true,
});
type LegacyStudentRegistrationRequest = z.infer<typeof LegacyStudentRegistrationRequestSchema>;

function safeParse<T>(schema: z.ZodType<T>, value: unknown): T {
  return schema.parse(value);
}

function createTeacherBody(input: TeacherRegistrationRequest, includeTerms: boolean): FormData {
  const form = new FormData();
  form.set("name", input.name);
  form.set("email", input.email);
  form.set("phone", input.phone);
  form.set("password", input.password);
  form.set("bio", input.bio);
  form.set("offerings", JSON.stringify(input.offerings));
  if (input.image) form.set("image", input.image);
  if (includeTerms) form.set("acceptTerms", String(input.acceptTerms));
  return form;
}

async function registerLegacyStudent(values: LegacyStudentRegistrationRequest) {
  try {
    const result = await request("/auth/register", LegacyRegistrationResponseSchema, {
      method: "POST",
      body: values,
    });
    return StudentRegistrationResponseSchema.parse({
      emailVerificationRequired: false,
      ...(result.data?.id || result.data?._id ? { userId: result.data.id ?? result.data._id } : {}),
    });
  } catch (error) {
    throw adaptCurrentAuthError(error, "register");
  }
}

/** Logs in against the target or legacy auth route and stores the returned access token. */
export async function login(input: LoginRequest): Promise<LoginResponse> {
  const values = safeParse(LoginRequestSchema, input);
  if (apiMode === "mock") {
    const result = await request("/auth/login", LoginResponseSchema, {
      method: "POST",
      body: values,
    });
    tokenStore.setSession({ accessToken: result.accessToken });
    return result;
  }
  try {
    const result = await request("/auth/login", LegacyLoginResponseSchema, {
      method: "POST",
      body: { email: values.email, password: values.password },
    });
    tokenStore.setSession({ accessToken: result.token });
    const user = await getMe();
    return LoginResponseSchema.parse({
      accessToken: result.token,
      expiresInSeconds: legacyLoginExpirySeconds(),
      user,
    });
  } catch (error) {
    tokenStore.clear();
    throw adaptCurrentAuthError(error, "login");
  }
}

/** Registers a student with the full target fields; the legacy adapter drops unsupported fields. */
export async function registerStudent(
  input: StudentRegistrationRequest | LegacyStudentRegistrationRequest,
) {
  if (apiMode === "live" && !capabilities.studentProfileFields) {
    return registerLegacyStudent(safeParse(LegacyStudentRegistrationRequestSchema, input));
  }
  const values = safeParse(StudentRegistrationRequestSchema, input);
  return request("/auth/register/student", StudentRegistrationResponseSchema, {
    method: "POST",
    body: values,
  });
}

/** Submits teacher details and offerings as multipart data for both API contracts. */
export async function registerTeacher(input: TeacherRegistrationRequest) {
  const values = safeParse(TeacherRegistrationRequestSchema, input);
  if (apiMode === "mock") {
    return request("/auth/register/teacher", TeacherRegistrationResponseSchema, {
      method: "POST",
      body: createTeacherBody(values, true),
    });
  }
  try {
    const result = await request("/teachers/signup", LegacyTeacherSignupResponseSchema, {
      method: "POST",
      body: createTeacherBody(values, false),
    });
    return TeacherRegistrationResponseSchema.parse({
      userId: result.data.user.id ?? result.data.user._id,
      applicationStatus: result.data.application.approvalStatus,
      emailVerificationRequired: false,
    });
  } catch (error) {
    throw adaptCurrentAuthError(error, "register");
  }
}

/** Verifies a six-digit email code when the selected backend supports email OTP. */
export async function verifyEmail(input: { email: string; code: string }) {
  const values = safeParse(EmailCodeRequestSchema, input);
  if (!capabilities.emailOtp) throw createCapabilityError("emailOtp");
  try {
    return await request("/auth/verify-email", AuthMessageResponseSchema, {
      method: "POST",
      body: values,
    });
  } catch (error) {
    throw apiMode === "live" ? adaptCurrentAuthError(error, "verify") : error;
  }
}

/** Requests another email verification code when the backend supports OTP. */
export async function resendCode(input: { email: string }) {
  const values = safeParse(ResendCodeRequestSchema, input);
  if (!capabilities.emailOtp) throw createCapabilityError("emailOtp");
  try {
    const result = await request("/auth/resend-code", AuthMessageResponseSchema, {
      method: "POST",
      body: values,
    });
    return result;
  } catch (error) {
    throw apiMode === "live" ? adaptCurrentAuthError(error, "verify") : error;
  }
}

/** Starts password recovery using the target email-based request. */
export async function forgotPassword(input: { email: string }) {
  const values = safeParse(ForgotPasswordRequestSchema, input);
  try {
    return await request("/auth/forgot-password", AuthMessageResponseSchema, {
      method: "POST",
      body: values,
    });
  } catch (error) {
    throw apiMode === "live" ? adaptCurrentAuthError(error, "recover") : error;
  }
}

/** Resets a password with an email recovery code without persisting either value. */
export async function resetPassword(input: { email: string; code: string; password: string }) {
  const values = safeParse(ResetPasswordRequestSchema, input);
  try {
    return await request("/auth/reset-password", AuthMessageResponseSchema, {
      method: "POST",
      body: values,
    });
  } catch (error) {
    throw apiMode === "live" ? adaptCurrentAuthError(error, "recover") : error;
  }
}

/** Invalidates the server session where supported and always clears the local token. */
export async function logout(): Promise<void> {
  try {
    if (apiMode === "mock") {
      await request("/auth/logout", LogoutResponseSchema, {
        method: "POST",
        preserveSessionOnUnauthorized: true,
      });
    } else {
      await request("/auth/logout", LegacyActionResponseSchema, {
        method: "POST",
        preserveSessionOnUnauthorized: true,
      });
    }
  } catch (error) {
    if (apiMode === "mock") throw error;
    throw adaptCurrentAuthError(error, "profile");
  } finally {
    tokenStore.clear();
  }
}

/** Reads the normalized current user, adapting the legacy profile and teacher application. */
export async function getMe(): Promise<AuthUser> {
  if (apiMode === "mock") {
    return request("/auth/me", AuthUserSchema, { preserveSessionOnUnauthorized: true });
  }
  try {
    const profile = await request("/auth/", LegacyProfileResponseSchema, {
      preserveSessionOnUnauthorized: true,
    });
    let application: unknown;
    const role = profile.data.roles ?? profile.data.role;
    if (role === "teacher") {
      try {
        application = await request(
          "/teachers/me/application",
          LegacyTeacherApplicationResponseSchema,
          { preserveSessionOnUnauthorized: true },
        );
      } catch (applicationError) {
        if (!(applicationError instanceof AppError) || applicationError.status !== 404) {
          throw applicationError;
        }
        application = undefined;
      }
    }
    return adaptLegacyUser(profile.data, application);
  } catch (error) {
    throw adaptCurrentAuthError(error, "profile");
  }
}

/** Requests a new access token through the target refresh-cookie endpoint. */
export async function refresh(): Promise<string> {
  if (!capabilities.refreshCookie) throw createCapabilityError("refreshCookie");
  const result = await request("/auth/refresh", AccessTokenResponseSchema, {
    method: "POST",
    credentials: "include",
  });
  tokenStore.setSession({ accessToken: result.accessToken });
  return result.accessToken;
}

/** Loads the public academic catalog when the selected backend advertises support. */
export async function getPublicCatalog(): Promise<AcademicCatalog> {
  if (!capabilities.publicCatalog) throw createCapabilityError("publicCatalog");
  try {
    return await request("/academic/public/catalog", AcademicCatalogSchema);
  } catch (error) {
    throw apiMode === "live" ? adaptCurrentAuthError(error, "profile") : error;
  }
}

/** Creates a device transfer request when supported by the selected backend. */
export async function createDeviceChangeRequest(input: { reason?: string }) {
  const values = safeParse(DeviceChangeRequestSchema, input);
  if (!capabilities.deviceChangeRequest) throw createCapabilityError("deviceChangeRequest");
  return request("/devices/change-requests", DeviceChangeResponseSchema, {
    method: "POST",
    body: values,
  });
}

/** Reads the signed-in user's device transfer request when the backend supports it. */
export async function getMyDeviceChangeRequest() {
  if (!capabilities.deviceChangeRequest) throw createCapabilityError("deviceChangeRequest");
  return request("/devices/change-requests/me", DeviceChangeResponseSchema);
}

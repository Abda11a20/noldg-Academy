import { beforeAll, describe, expect, it, vi } from "vitest";
import type * as CapabilityModule from "./capabilities";

let capabilityModule: typeof CapabilityModule;

beforeAll(async () => {
  vi.stubEnv("VITE_API_MODE", "live");
  vi.stubEnv("VITE_AUTH_CAP_EMAIL_OTP", "true");
  vi.stubEnv("VITE_AUTH_CAP_REFRESH_COOKIE", "false");
  vi.stubEnv("VITE_AUTH_CAP_STUDENT_PROFILE_FIELDS", "true");
  capabilityModule = await import("./capabilities");
});

describe("live backend capability overrides", () => {
  it("applies explicit public flags while leaving unspecified live capabilities disabled", () => {
    expect(capabilityModule.capabilities).toEqual({
      emailOtp: true,
      refreshCookie: false,
      studentProfileFields: true,
      publicCatalog: false,
      deviceChangeRequest: false,
      adminAcademicAccess: false,
      teacherApplicationsApi: false,
      adminSearchAndPagination: false,
    });
  });
});

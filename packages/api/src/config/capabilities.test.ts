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
      bundleLessons: false,
      liveLessons: false,
      lessonWindowRules: false,
      lessonDrafts: false,
      lessonVideoProcessing: false,
      studentTrackFilter: false,
      teacherRatings: false,
      teacherStartingPrice: false,
      lessonAvailabilityField: false,
      teacherBrowseCourses: false,
      teacherBrowseFilters: false,
      orderNumber: false,
      orderExpiry: false,
      orderSenderRef: false,
      singleStepOrder: false,
      manualOrder: false,
      publicSettings: false,
      idempotencyKey: false,
      orderAdminFilters: false,
      orderCancellation: false,
      myLessonsList: false,
      studentLessonDetail: false,
      lessonProgressApi: true,
      streamingDelivery: false,
      playbackWatermark: false,
      attachmentDownload: false,
      playbackSessionApi: true,
      deliveryIsDownloadable: true,
      questionImages: false,
      questionArchive: false,
      questionMetadata: false,
      assessmentTargeting: false,
      assessmentRandomPool: false,
      assessmentShuffle: false,
      assessmentResultsApi: false,
      quizThresholdSetting: false,
      mcqOnly: false,
    });
  });
});

describe("mock catalog capability defaults", () => {
  it("enables target catalog behavior except live lessons by default", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_API_MODE", "mock");
    vi.stubEnv("VITE_CATALOG_CAP_BUNDLE_LESSONS", "");
    const { capabilities } = await import("./capabilities");
    expect(capabilities).toMatchObject({
      bundleLessons: true,
      liveLessons: false,
      lessonWindowRules: true,
      lessonDrafts: true,
      lessonVideoProcessing: true,
      questionImages: true,
      questionArchive: true,
      questionMetadata: true,
      assessmentTargeting: true,
      assessmentRandomPool: true,
      assessmentShuffle: true,
      assessmentResultsApi: true,
      quizThresholdSetting: true,
      mcqOnly: true,
    });
  });
});

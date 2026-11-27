import { apiMode } from "../mocks/mode";

export interface AuthCapabilities {
  emailOtp: boolean;
  refreshCookie: boolean;
  studentProfileFields: boolean;
  publicCatalog: boolean;
  deviceChangeRequest: boolean;
  adminAcademicAccess: boolean;
  teacherApplicationsApi: boolean;
  adminSearchAndPagination: boolean;
  bundleLessons: boolean;
  liveLessons: boolean;
  lessonWindowRules: boolean;
  lessonDrafts: boolean;
  lessonVideoProcessing: boolean;
  studentTrackFilter: boolean;
  teacherRatings: boolean;
  teacherStartingPrice: boolean;
  lessonAvailabilityField: boolean;
  teacherBrowseCourses: boolean;
  teacherBrowseFilters: boolean;
  orderNumber: boolean;
  orderExpiry: boolean;
  orderSenderRef: boolean;
  singleStepOrder: boolean;
  manualOrder: boolean;
  publicSettings: boolean;
  idempotencyKey: boolean;
  orderAdminFilters: boolean;
  orderCancellation: boolean;
  myLessonsList: boolean;
  studentLessonDetail: boolean;
  lessonProgressApi: boolean;
  streamingDelivery: boolean;
  playbackWatermark: boolean;
  attachmentDownload: boolean;
  playbackSessionApi: boolean;
  deliveryIsDownloadable: boolean;
}

function resolveCapability(value: string | undefined, defaultValue: boolean): boolean {
  if (value === "true") return true;
  if (value === "false") return false;
  return defaultValue;
}

const modeDefault = apiMode === "mock";

/** Exposes target-auth capabilities with safe current-backend defaults and public Vite overrides. */
export const capabilities: AuthCapabilities = {
  emailOtp: resolveCapability(import.meta.env.VITE_AUTH_CAP_EMAIL_OTP, modeDefault),
  refreshCookie: resolveCapability(import.meta.env.VITE_AUTH_CAP_REFRESH_COOKIE, modeDefault),
  studentProfileFields: resolveCapability(
    import.meta.env.VITE_AUTH_CAP_STUDENT_PROFILE_FIELDS,
    modeDefault,
  ),
  publicCatalog: resolveCapability(import.meta.env.VITE_AUTH_CAP_PUBLIC_CATALOG, modeDefault),
  deviceChangeRequest: resolveCapability(
    import.meta.env.VITE_AUTH_CAP_DEVICE_CHANGE_REQUEST,
    modeDefault,
  ),
  adminAcademicAccess: resolveCapability(import.meta.env.VITE_ADMIN_ACADEMIC_ACCESS, modeDefault),
  teacherApplicationsApi: resolveCapability(
    import.meta.env.VITE_TEACHER_APPLICATIONS_API,
    modeDefault,
  ),
  adminSearchAndPagination: resolveCapability(
    import.meta.env.VITE_ADMIN_SEARCH_PAGINATION,
    modeDefault,
  ),
  bundleLessons: resolveCapability(import.meta.env.VITE_CATALOG_CAP_BUNDLE_LESSONS, modeDefault),
  liveLessons: resolveCapability(import.meta.env.VITE_CATALOG_CAP_LIVE_LESSONS, false),
  lessonWindowRules: resolveCapability(
    import.meta.env.VITE_CATALOG_CAP_LESSON_WINDOW_RULES,
    modeDefault,
  ),
  lessonDrafts: resolveCapability(import.meta.env.VITE_CATALOG_CAP_LESSON_DRAFTS, modeDefault),
  lessonVideoProcessing: resolveCapability(
    import.meta.env.VITE_CATALOG_CAP_VIDEO_PROCESSING,
    modeDefault,
  ),
  studentTrackFilter: resolveCapability(import.meta.env.VITE_BROWSE_TRACK_FILTER, modeDefault),
  teacherRatings: resolveCapability(import.meta.env.VITE_BROWSE_TEACHER_RATINGS, modeDefault),
  teacherStartingPrice: resolveCapability(import.meta.env.VITE_BROWSE_STARTING_PRICE, modeDefault),
  lessonAvailabilityField: resolveCapability(
    import.meta.env.VITE_BROWSE_LESSON_AVAILABILITY,
    modeDefault,
  ),
  teacherBrowseCourses: resolveCapability(import.meta.env.VITE_BROWSE_TEACHER_COURSES, modeDefault),
  teacherBrowseFilters: resolveCapability(import.meta.env.VITE_BROWSE_TEACHER_FILTERS, modeDefault),
  orderNumber: resolveCapability(import.meta.env.VITE_ORDER_CAP_NUMBER, modeDefault),
  orderExpiry: resolveCapability(import.meta.env.VITE_ORDER_CAP_EXPIRY, modeDefault),
  orderSenderRef: resolveCapability(import.meta.env.VITE_ORDER_CAP_SENDER_REF, modeDefault),
  singleStepOrder: resolveCapability(import.meta.env.VITE_ORDER_CAP_SINGLE_STEP, modeDefault),
  manualOrder: resolveCapability(import.meta.env.VITE_ORDER_CAP_MANUAL, modeDefault),
  publicSettings: resolveCapability(import.meta.env.VITE_ORDER_CAP_PUBLIC_SETTINGS, modeDefault),
  idempotencyKey: resolveCapability(import.meta.env.VITE_ORDER_CAP_IDEMPOTENCY, modeDefault),
  orderAdminFilters: resolveCapability(import.meta.env.VITE_ORDER_CAP_ADMIN_FILTERS, modeDefault),
  orderCancellation: resolveCapability(import.meta.env.VITE_ORDER_CAP_CANCELLATION, modeDefault),
  myLessonsList: resolveCapability(import.meta.env.VITE_LEARNING_MY_LESSONS, modeDefault),
  studentLessonDetail: resolveCapability(import.meta.env.VITE_LEARNING_STUDENT_DETAIL, modeDefault),
  lessonProgressApi: resolveCapability(import.meta.env.VITE_LEARNING_PROGRESS, true),
  streamingDelivery: resolveCapability(import.meta.env.VITE_LEARNING_STREAMING, false),
  playbackWatermark: resolveCapability(import.meta.env.VITE_LEARNING_WATERMARK, modeDefault),
  attachmentDownload: resolveCapability(import.meta.env.VITE_LEARNING_ATTACHMENTS, modeDefault),
  playbackSessionApi: resolveCapability(import.meta.env.VITE_LEARNING_PLAYBACK, true),
  deliveryIsDownloadable: apiMode === "live",
};

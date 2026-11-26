import type {
  CatalogCourse,
  CatalogLesson,
  CatalogProduct,
  UploadTicket,
} from "../../contracts/catalog";

export const MOCK_PLATFORM_COMMISSION_PERCENTAGE = 20;
export const MOCK_ZERO_AMOUNT = 0;
export const DEFAULT_MOCK_ANNOUNCED_LESSON_COUNT = 1;
export const MOCK_VIDEO_READY_POLL_COUNT = 2;
export const MOCK_VIDEO_FAILED_POLL_COUNT = 2;

export const MOCK_COURSES: CatalogCourse[] = [
  {
    id: "course-general-secondary-1",
    subject: { id: "subject-math", name: "Mathematics" },
    track: {
      id: "track-general-secondary-1",
      name: "Grade 1",
      system: "general",
      stage: "secondary",
      grade: 1,
    },
    lessonCount: 2,
    packageCount: 1,
    status: "active",
  },
];

export const MOCK_LESSONS: CatalogLesson[] = [
  {
    id: "lesson-introduction",
    courseId: "course-general-secondary-1",
    title: "Introduction",
    description: "An introduction lesson.",
    kind: "recorded",
    status: "published",
    availableFrom: "2024-01-01T00:00:00.000Z",
    availableUntil: "2030-01-01T00:00:00.000Z",
    access: "paid",
    price: 150,
    videoState: "ready",
    video: { publicId: "mock-video", format: "mp4" },
    attachments: [],
    startLocked: false,
  },
];

export const MOCK_PRODUCTS: CatalogProduct[] = [
  {
    id: "product-introduction",
    courseId: "course-general-secondary-1",
    type: "lesson",
    name: "Introduction",
    price: 150,
    lessonId: "lesson-introduction",
    announcedLessonCount: 1,
    lessonIds: [],
    status: "active",
  },
  {
    id: "package-foundations",
    courseId: "course-general-secondary-1",
    type: "package",
    name: "Foundations package",
    price: 300,
    announcedLessonCount: 3,
    lessonIds: ["lesson-introduction"],
    status: "active",
  },
  {
    id: "browse-bundle-1",
    courseId: "course-general-secondary-1",
    type: "package",
    name: "Algebra bundle",
    price: 250,
    announcedLessonCount: 5,
    lessonIds: ["lesson-introduction"],
    status: "active",
  },
];

export const MOCK_UPLOAD_TICKET: UploadTicket = {
  method: "form-post",
  url: "https://api.cloudinary.com/mock-upload",
  fields: { mockScenario: "success" },
  uploadToken: "mock-upload-token",
  expiresAt: "2030-01-01T00:00:00.000Z",
};

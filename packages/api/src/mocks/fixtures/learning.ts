import type { StudentLesson } from "../../contracts/learning";

export const MOCK_LEARNING_SERVER_NOW = "2026-11-27T10:00:00.000Z";

export const MOCK_STUDENT_LESSONS: StudentLesson[] = [
  {
    id: "lesson-introduction",
    title: "Introduction to algebra",
    description: "Variables and expressions.",
    teacher: { id: "teacher-nour", name: "Nour Hassan" },
    course: { id: "course-general-secondary-1", name: "Mathematics" },
    availableFrom: "2026-11-20T10:00:00.000Z",
    availableUntil: "2026-12-20T10:00:00.000Z",
    availability: "available",
    serverNow: MOCK_LEARNING_SERVER_NOW,
    access: "owned",
    progress: { watchedPercent: 70, thresholdReached: false, lastPositionSeconds: 35 },
    attachments: [
      { id: "attachment-notes", name: "Algebra notes.pdf", size: 12000, type: "application/pdf" },
    ],
    quiz: { available: false, id: "quiz-algebra-basics" },
    prerequisiteLessonId: null,
  },
  {
    id: "lesson-upcoming",
    title: "Quadratic equations",
    description: "An upcoming lesson.",
    teacher: { id: "teacher-nour", name: "Nour Hassan" },
    course: { id: "course-general-secondary-1", name: "Mathematics" },
    availableFrom: "2026-11-29T10:00:00.000Z",
    availableUntil: "2026-12-29T10:00:00.000Z",
    availability: "upcoming",
    serverNow: MOCK_LEARNING_SERVER_NOW,
    access: "owned",
    progress: { watchedPercent: 0, thresholdReached: false, lastPositionSeconds: 0 },
    attachments: [],
    quiz: { available: false },
    prerequisiteLessonId: "lesson-introduction",
  },
  {
    id: "lesson-ended",
    title: "Linear equations review",
    description: "An ended lesson.",
    teacher: { id: "teacher-omar", name: "Omar El Sayed" },
    course: { id: "course-general-secondary-1", name: "Mathematics" },
    availableFrom: "2026-10-01T10:00:00.000Z",
    availableUntil: "2026-11-01T10:00:00.000Z",
    availability: "ended",
    serverNow: MOCK_LEARNING_SERVER_NOW,
    access: "not_owned",
    productId: "product-lesson-linear-review",
    progress: { watchedPercent: 0, thresholdReached: false, lastPositionSeconds: 0 },
    attachments: [],
    quiz: { available: false },
    prerequisiteLessonId: null,
  },
];

/** Playback-only fixtures exercise fatal, retry, and token-expiry session scenarios. */
export const MOCK_LEARNING_SCENARIOS: StudentLesson[] = [
  ...[
    "session-replaced",
    "token-expired",
    "network-heartbeat",
    "out-of-order",
    "rate-rejected",
  ].map((scenario) => {
    const base = MOCK_STUDENT_LESSONS[0];
    if (!base) throw new Error("The playback fixture requires a lesson base.");
    return { ...base, id: `lesson-${scenario}` };
  }),
  ...(() => {
    const base = MOCK_STUDENT_LESSONS[0];
    if (!base) return [];
    return [{ ...base, id: "lesson-not-owned", access: "not_owned" as const }];
  })(),
];

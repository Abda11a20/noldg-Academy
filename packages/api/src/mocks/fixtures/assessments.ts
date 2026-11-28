import {
  AssessmentAttemptDetailSchema,
  AssessmentListSchema,
  type Question,
} from "../../contracts/assessments";

export const MOCK_QUESTION_COUNT = 40;
const mockDifficulties = ["easy", "medium", "hard"] as const;

/** Bilingual target MCQ fixtures spanning lesson, subject, and difficulty filters. */
export const MOCK_QUESTIONS: Question[] = Array.from(
  { length: MOCK_QUESTION_COUNT },
  (_, index) => {
    const number = index + 1;
    const isArabic = number % 2 === 1;
    return {
      id: `question-mock-${number}`,
      type: "multiple_choice",
      text: isArabic ? `سؤال تدريبي رقم ${number}` : `Practice question ${number}`,
      options: isArabic
        ? [{ text: "الإجابة أ" }, { text: "الإجابة ب" }, { text: "الإجابة ج" }]
        : [{ text: "Option A" }, { text: "Option B" }, { text: "Option C" }],
      correctIndex: number % 3,
      explanation: isArabic ? "شرح تدريبي مختصر." : "Short practice explanation.",
      subjectId: `subject-${(number % 4) + 1}`,
      lessonId: `lesson-${(number % 6) + 1}`,
      difficulty: mockDifficulties[index % mockDifficulties.length],
      status: number % 9 === 0 ? "archived" : "active",
      used: number % 4 === 0,
    };
  },
);

const mockAssessmentDate = "2026-10-01T08:00:00.000Z";

/** Target assessment examples spanning every status and assessment type. */
export const MOCK_ASSESSMENTS = AssessmentListSchema.parse({
  items: [
    {
      id: "assessment-exam-draft",
      type: "exam",
      courseId: "course-1",
      title: "مراجعة منتصف الفصل | Midterm review",
      status: "draft",
      questionIds: ["question-mock-1", "question-mock-2", "question-mock-3"],
      shuffle: true,
      showResults: "after_close",
      targetMode: "all_course_students",
      studentIds: [],
      windowStart: "2026-12-01T08:00:00.000Z",
      windowEnd: "2026-12-01T10:00:00.000Z",
      durationMinutes: 90,
      maxAttempts: 2,
      attemptCount: 0,
    },
    {
      id: "assessment-exam-published",
      type: "exam",
      courseId: "course-1",
      title: "الاختبار الأول | First exam",
      status: "published",
      questionIds: ["question-mock-4", "question-mock-5", "question-mock-6"],
      randomCount: 2,
      shuffle: true,
      showResults: "immediate",
      maxTabLeaves: 2,
      targetMode: "all_course_students",
      studentIds: [],
      windowStart: "2026-10-01T08:00:00.000Z",
      windowEnd: "2026-12-01T10:00:00.000Z",
      durationMinutes: 60,
      maxAttempts: 1,
      attemptCount: 3,
    },
    {
      id: "assessment-homework-closed",
      type: "homework",
      courseId: "course-1",
      title: "واجب النحو | Grammar homework",
      status: "closed",
      questionIds: ["question-mock-7", "question-mock-8"],
      shuffle: false,
      showResults: "after_close",
      targetMode: "selected_students",
      studentIds: ["student-1"],
      windowStart: "2026-10-01T00:00:00.000Z",
      windowEnd: "2026-10-08T23:59:59.000Z",
      maxAttempts: 1,
      attemptCount: 1,
    },
    {
      id: "assessment-quiz-archived",
      type: "quiz",
      courseId: "course-1",
      lessonId: "lesson-1",
      title: "اختبار الدرس | Lesson quiz",
      status: "archived",
      questionIds: ["question-mock-9", "question-mock-10"],
      shuffle: true,
      showResults: "immediate",
      targetMode: "all_course_students",
      studentIds: [],
      maxAttempts: 1,
      requiredWatchPercentage: 75,
      attemptCount: 2,
    },
  ],
  page: 1,
  pageSize: 20,
  total: 4,
});

/** Attempt summaries include server-computed scores and suspicious flags. */
export const MOCK_ASSESSMENT_ATTEMPTS = [
  {
    id: "attempt-1",
    student: { id: "student-1", name: "مريم حسن" },
    score: 8,
    total: 10,
    startedAt: mockAssessmentDate,
    submittedAt: "2026-10-01T09:00:00.000Z",
    submitReason: "manual" as const,
    tabLeaves: 0,
    suspicious: false,
  },
  {
    id: "attempt-2",
    student: { id: "student-2", name: "Omar Ali" },
    score: 4,
    total: 10,
    startedAt: mockAssessmentDate,
    submittedAt: "2026-10-01T09:15:00.000Z",
    submitReason: "auto" as const,
    tabLeaves: 5,
    suspicious: true,
  },
];

export const MOCK_ASSESSMENT_RESULTS_SUMMARY = {
  averageScore: 6,
  manualCount: 1,
  autoCount: 1,
  suspiciousCount: 1,
};

/** Frozen attempt detail fixture keeps the original question content on the attempt record. */
export const MOCK_ASSESSMENT_ATTEMPT_DETAIL = AssessmentAttemptDetailSchema.parse({
  ...MOCK_ASSESSMENT_ATTEMPTS[1],
  assessmentId: "assessment-exam-published",
  questions: [
    {
      question: MOCK_QUESTIONS[3],
      selectedIndex: 0,
    },
  ],
});

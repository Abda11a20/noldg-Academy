import type { Question } from "../../contracts/assessments";

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

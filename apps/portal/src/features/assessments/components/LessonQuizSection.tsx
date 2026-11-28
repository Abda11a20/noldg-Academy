import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Heading, SearchableMultiSelect, Skeleton, TextField } from "@noldg/ui";
import type { QuestionEntry } from "@noldg/api/contracts/assessments";
import { DEFAULT_QUIZ_WATCH_PERCENTAGE } from "../constants";
import { useLessonQuiz } from "../hooks/useLessonQuiz";

function isSelectableQuestion(question: QuestionEntry): boolean {
  return !("supported" in question);
}

interface LessonQuizSectionProps {
  courseId: string;
  lessonId: string;
}

/** Lets a teacher create and publish the lesson's single MCQ quiz.
 * @param props Saved lesson and course identifiers.
 */
export function LessonQuizSection({ courseId, lessonId }: LessonQuizSectionProps) {
  const { t } = useTranslation("assessments");
  const [search, setSearch] = useState("");
  const quiz = useLessonQuiz(courseId, lessonId);
  if (quiz.assessments.isPending || quiz.questions.isPending) return <Skeleton height="md" />;
  if (quiz.assessments.isError || quiz.questions.isError)
    return (
      <Alert tone="danger" role="alert">
        {t("loadError")}
      </Alert>
    );
  if (!quiz.canEdit) return <Alert tone="info">{t("quizUnavailable")}</Alert>;
  if (quiz.existingQuiz)
    return (
      <Alert tone="info">
        {t("lessonQuizExists", {
          title: quiz.existingQuiz.title,
          status: t(`status.${quiz.existingQuiz.status}`),
        })}
      </Alert>
    );
  const normalizedSearch = search.trim().toLowerCase();
  const questions = quiz.questions.data.items
    .filter(isSelectableQuestion)
    .filter((question) => question.text.toLowerCase().includes(normalizedSearch));
  return (
    <section className="space-y-4">
      <Heading level={2}>{t("lessonQuizTitle")}</Heading>
      <Alert tone="info">
        {t("quizThresholdDefault", { percentage: DEFAULT_QUIZ_WATCH_PERCENTAGE })}
      </Alert>
      <TextField
        id="lesson-quiz-title"
        label={t("titleLabel")}
        value={quiz.title}
        onChange={(event) => quiz.setTitle(event.currentTarget.value)}
        required
      />
      <SearchableMultiSelect
        id="lesson-quiz-questions"
        label={t("questionsLabel")}
        searchLabel={t("questionSearchLabel")}
        searchValue={search}
        onSearchChange={setSearch}
        options={questions.map((question) => ({ value: question.id, label: question.text }))}
        selectedValues={quiz.selectedIds}
        selectedSummary={t("selectedQuestionCount", { count: quiz.selectedIds.length })}
        onSelectedValuesChange={quiz.setSelectedIds}
        emptyLabel={t("noQuestions")}
        loadingLabel={t("loadingQuestions")}
      />
      <Button
        disabled={!quiz.title.trim() || !quiz.selectedIds.length || quiz.createQuiz.isPending}
        loading={quiz.createQuiz.isPending}
        onClick={() => quiz.createQuiz.mutate({ title: quiz.title, questionIds: quiz.selectedIds })}
      >
        {t("createAndPublishQuiz")}
      </Button>
    </section>
  );
}

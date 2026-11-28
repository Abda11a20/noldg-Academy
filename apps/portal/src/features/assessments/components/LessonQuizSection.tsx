import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Badge,
  Button,
  Heading,
  NumberField,
  SearchableMultiSelect,
  Skeleton,
  TextField,
} from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import type { Assessment, QuestionEntry } from "@noldg/api/contracts/assessments";
import {
  ASSESSMENT_MAX_WATCH_PERCENTAGE,
  ASSESSMENT_MIN_WATCH_PERCENTAGE,
  DEFAULT_QUIZ_WATCH_PERCENTAGE,
} from "../constants";
import { useLessonQuiz } from "../hooks/useLessonQuiz";
import { getTeacherAssessmentResultsPath } from "../routes";
import { CreateQuestionDialog } from "../../question-bank/index";

function isSelectableQuestion(question: QuestionEntry): boolean {
  return !("supported" in question);
}

interface ExistingLessonQuizProps {
  courseId: string;
  quiz: Assessment;
  publishing: boolean;
  onPublish: (id: string) => void;
}

function ExistingLessonQuiz({ courseId, quiz, publishing, onPublish }: ExistingLessonQuizProps) {
  const { t } = useTranslation("assessments");
  const tone = quiz.status === "published" ? "success" : "neutral";
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Heading level={2}>{t("lessonQuizTitle")}</Heading>
        <Badge tone={tone}>{t(`status.${quiz.status}`)}</Badge>
      </div>
      <Alert tone="info">
        {t("lessonQuizExists", {
          title: quiz.title,
          status: t(`status.${quiz.status}`),
        })}
      </Alert>
      <div className="flex flex-wrap gap-3">
        {quiz.status === "draft" ? (
          <Button disabled={publishing} loading={publishing} onClick={() => onPublish(quiz.id)}>
            {t("quizPublishDraft")}
          </Button>
        ) : null}
        {capabilities.assessmentResultsApi ? (
          <Button variant="secondary" to={getTeacherAssessmentResultsPath(courseId, quiz.id)}>
            {t("results")}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

interface LessonQuizSectionProps {
  courseId: string;
  lessonId: string;
}

/** Lets a teacher create, optionally draft or publish, and manage the lesson's single MCQ quiz.
 * @param props Saved lesson and course identifiers.
 */
export function LessonQuizSection({ courseId, lessonId }: LessonQuizSectionProps) {
  const { t } = useTranslation("assessments");
  const [search, setSearch] = useState("");
  const [createQuestionOpen, setCreateQuestionOpen] = useState(false);
  const quiz = useLessonQuiz(courseId, lessonId);

  if (quiz.assessments.isPending || quiz.questions.isPending) return <Skeleton height="md" />;
  if (quiz.assessments.isError || quiz.questions.isError) {
    return (
      <Alert tone="danger" role="alert">
        {t("loadError")}
      </Alert>
    );
  }
  if (!quiz.canEdit) return <Alert tone="info">{t("quizUnavailable")}</Alert>;
  if (quiz.existingQuiz) {
    return (
      <ExistingLessonQuiz
        courseId={courseId}
        quiz={quiz.existingQuiz}
        publishing={quiz.publish.isPending}
        onPublish={(id) => {
          if (!quiz.publish.isPending) quiz.publish.mutate(id);
        }}
      />
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const submitDisabled = !quiz.canSubmit || quiz.saveQuiz.isPending;
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
      <NumberField
        id="lesson-quiz-watch-percent"
        label={t("quizWatchPercentLabel")}
        hint={t("quizWatchPercentHint")}
        min={ASSESSMENT_MIN_WATCH_PERCENTAGE}
        max={ASSESSMENT_MAX_WATCH_PERCENTAGE}
        value={quiz.watchPercentage}
        onChange={(event) => quiz.setWatchPercentage(event.currentTarget.value)}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={() => setCreateQuestionOpen(true)}>
          {t("quizAddQuestion")}
        </Button>
      </div>
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
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={submitDisabled}
          loading={quiz.saveQuiz.isPending}
          onClick={() => quiz.submitQuiz(false)}
        >
          {t("quizSaveDraft")}
        </Button>
        <Button
          disabled={submitDisabled}
          loading={quiz.saveQuiz.isPending}
          onClick={() => quiz.submitQuiz(true)}
        >
          {t("createAndPublishQuiz")}
        </Button>
      </div>
      <CreateQuestionDialog
        open={createQuestionOpen}
        onOpenChange={setCreateQuestionOpen}
        onCreated={(created) => quiz.addSelectedQuestion(created.id)}
      />
    </section>
  );
}

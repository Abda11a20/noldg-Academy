import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Skeleton } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import { useAssessmentBuilder } from "../hooks/useAssessmentBuilder";
import { AssessmentBuilderForm } from "../components/AssessmentBuilderForm";

/** Creates a draft exam or homework using server validation as the authority.
 * @returns The selected assessment type's accessible builder form.
 */
export function AssessmentBuilderPage() {
  const { t } = useTranslation("assessments");
  const { courseId = "", type: routeType, action = "exam" } = useParams();
  const rawType = routeType ?? action;
  const type = rawType === "homework" ? "homework" : "exam";
  const navigate = useNavigate();
  const builder = useAssessmentBuilder(courseId, type);
  if (builder.queries.questions.isPending) return <Skeleton height="lg" />;
  if (builder.queries.questions.isError) return <Alert tone="danger">{t("loadError")}</Alert>;
  if (!capabilities.assessmentTargeting) return <Alert tone="info">{t("liveUnavailable")}</Alert>;
  const onSubmit = () => {
    void builder.submit()?.then(() => navigate(`/teacher/courses/${encodeURIComponent(courseId)}`));
  };
  return (
    <AssessmentBuilderForm
      courseId={courseId}
      type={type}
      questions={builder.questions}
      orderedQuestions={builder.orderedQuestions}
      selectedIds={builder.selectedIds}
      title={builder.title}
      duration={builder.duration}
      maxAttempts={builder.maxAttempts}
      start={builder.start}
      end={builder.end}
      questionSearch={builder.questionSearch}
      pending={builder.queries.create.isPending}
      onTitleChange={builder.setTitle}
      onDurationChange={builder.setDuration}
      onMaxAttemptsChange={builder.setMaxAttempts}
      onStartChange={builder.setStart}
      onEndChange={builder.setEnd}
      onQuestionSearchChange={builder.setQuestionSearch}
      onSelectedIdsChange={builder.setSelectedIds}
      onMoveQuestion={builder.moveQuestion}
      onRemoveQuestion={builder.removeQuestion}
      onSubmit={onSubmit}
    />
  );
}

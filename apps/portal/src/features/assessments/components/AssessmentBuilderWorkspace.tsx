import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { Assessment } from "@noldg/api/contracts/assessments";
import { Alert, Skeleton } from "@noldg/ui";
import { getTeacherCoursePath } from "../../../shared/navigation/routes";
import { useAssessmentBuilder } from "../hooks/useAssessmentBuilder";
import type { EditableAssessmentType } from "../utils/builder-validation";
import { AssessmentBuilderForm } from "./AssessmentBuilderForm";

interface AssessmentBuilderWorkspaceProps {
  courseId: string;
  type: EditableAssessmentType;
  existing?: Assessment;
}

/** Connects builder state to the presentation form after any existing assessment record has loaded.
 * @param props Course identifier, resolved assessment type, and optional loaded assessment.
 */
export function AssessmentBuilderWorkspace({
  courseId,
  type,
  existing,
}: AssessmentBuilderWorkspaceProps) {
  const { t } = useTranslation("assessments");
  const navigate = useNavigate();
  const builder = useAssessmentBuilder({
    courseId,
    type,
    ...(existing ? { existing } : {}),
    onSaved: () => void navigate(getTeacherCoursePath(courseId)),
  });
  if (builder.queries.questions.isPending) return <Skeleton height="lg" />;
  if (builder.queries.questions.isError)
    return (
      <Alert tone="danger" role="alert">
        {t("loadError")}
      </Alert>
    );
  return (
    <AssessmentBuilderForm
      courseId={courseId}
      type={type}
      isEdit={Boolean(existing)}
      isDraftStatus={!existing || existing.status === "draft"}
      draft={builder.draft}
      locked={builder.locked}
      pending={builder.pending}
      validationError={builder.validationError}
      serverError={builder.serverError}
      hasLegacyQuestions={builder.hasLegacyQuestions}
      questions={builder.questions}
      orderedQuestions={builder.orderedQuestions}
      students={builder.students}
      studentsLoading={builder.studentsLoading}
      questionSearch={builder.questionSearch}
      subjectFilter={builder.subjectFilter}
      lessonFilter={builder.lessonFilter}
      difficultyFilter={builder.difficultyFilter}
      studentSearch={builder.studentSearch}
      leaveBlocked={builder.leaveBlocked}
      onDraftChange={builder.updateDraft}
      onQuestionSearchChange={builder.setQuestionSearch}
      onSubjectFilterChange={builder.setSubjectFilter}
      onLessonFilterChange={builder.setLessonFilter}
      onDifficultyFilterChange={builder.setDifficultyFilter}
      onStudentSearchChange={builder.setStudentSearch}
      onMoveQuestion={builder.moveQuestion}
      onRemoveQuestion={builder.removeQuestion}
      onSaveDraft={builder.saveDraft}
      onSaveAndPublish={builder.saveAndPublish}
      onConfirmLeave={builder.confirmLeave}
      onCancelLeave={builder.cancelLeave}
    />
  );
}

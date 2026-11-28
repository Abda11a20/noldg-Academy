import { useTranslation } from "react-i18next";
import type { CourseStudent, Question } from "@noldg/api/contracts/assessments";
import { Alert, Breadcrumbs, Button, ConfirmDialog, Heading, TextField } from "@noldg/ui";
import { getTeacherCoursePath } from "../../../shared/navigation/routes";
import type {
  AssessmentBuilderDraft,
  BuilderValidationKey,
  EditableAssessmentType,
} from "../utils/builder-validation";
import { AssessmentAudienceFields } from "./AssessmentAudienceFields";
import { AssessmentQuestionsSection } from "./AssessmentQuestionsSection";
import { AssessmentRulesFields } from "./AssessmentRulesFields";
import { AssessmentScheduleFields } from "./AssessmentScheduleFields";

export interface AssessmentBuilderFormProps {
  courseId: string;
  type: EditableAssessmentType;
  isEdit: boolean;
  isDraftStatus: boolean;
  draft: AssessmentBuilderDraft;
  locked: boolean;
  pending: boolean;
  validationError: BuilderValidationKey | null;
  serverError: string | null;
  hasLegacyQuestions: boolean;
  questions: readonly Question[];
  orderedQuestions: readonly { id: string; label: string }[];
  students: readonly CourseStudent[];
  studentsLoading: boolean;
  questionSearch: string;
  subjectFilter: string;
  lessonFilter: string;
  difficultyFilter: string;
  studentSearch: string;
  leaveBlocked: boolean;
  onDraftChange: <K extends keyof AssessmentBuilderDraft>(
    field: K,
    value: AssessmentBuilderDraft[K],
  ) => void;
  onQuestionSearchChange: (value: string) => void;
  onSubjectFilterChange: (value: string) => void;
  onLessonFilterChange: (value: string) => void;
  onDifficultyFilterChange: (value: string) => void;
  onStudentSearchChange: (value: string) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onRemoveQuestion: (id: string) => void;
  onSaveDraft: () => void;
  onSaveAndPublish: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: (open: boolean) => void;
}

/** Renders the full exam/homework builder with schedule, rules, audience, bank filters, and leave guard.
 * @param props Controlled builder state, validation reason, lock flag, and event callbacks.
 */
export function AssessmentBuilderForm(props: AssessmentBuilderFormProps) {
  const { t } = useTranslation("assessments");
  const { draft, locked, onDraftChange } = props;
  const pageTitle = t(props.isEdit ? "editTitle" : "builderTitle", { type: t(props.type) });
  const canSubmit = !props.pending && props.validationError === null;
  return (
    <section className="space-y-6">
      <Breadcrumbs
        label={t("breadcrumbs")}
        items={[
          { label: t("course"), to: getTeacherCoursePath(props.courseId) },
          { label: pageTitle },
        ]}
      />
      <Heading level={1}>{pageTitle}</Heading>
      {locked ? <Alert tone="info">{t("lockedNotice")}</Alert> : null}
      {props.serverError ? (
        <Alert tone="danger" role="alert">
          {props.serverError}
        </Alert>
      ) : null}
      <TextField
        id="assessment-title"
        label={t("titleLabel")}
        value={draft.title}
        disabled={locked}
        onChange={(event) => onDraftChange("title", event.currentTarget.value)}
        required
      />
      <AssessmentScheduleFields
        type={props.type}
        start={draft.start}
        end={draft.end}
        duration={draft.duration}
        maxAttempts={draft.maxAttempts}
        locked={locked}
        onStartChange={(value) => onDraftChange("start", value)}
        onEndChange={(value) => onDraftChange("end", value)}
        onDurationChange={(value) => onDraftChange("duration", value)}
        onMaxAttemptsChange={(value) => onDraftChange("maxAttempts", value)}
      />
      <AssessmentRulesFields
        shuffle={draft.shuffle}
        randomCount={draft.randomCount}
        poolSize={draft.selectedIds.length}
        showResults={draft.showResults}
        maxTabLeaves={draft.maxTabLeaves}
        locked={locked}
        onShuffleChange={(value) => onDraftChange("shuffle", value)}
        onRandomCountChange={(value) => onDraftChange("randomCount", value)}
        onShowResultsChange={(value) => onDraftChange("showResults", value)}
        onMaxTabLeavesChange={(value) => onDraftChange("maxTabLeaves", value)}
      />
      <AssessmentAudienceFields
        targetMode={draft.targetMode}
        studentIds={draft.studentIds}
        students={props.students}
        studentsLoading={props.studentsLoading}
        studentSearch={props.studentSearch}
        locked={locked}
        onTargetModeChange={(value) => onDraftChange("targetMode", value)}
        onStudentIdsChange={(values) => onDraftChange("studentIds", values)}
        onStudentSearchChange={props.onStudentSearchChange}
      />
      <AssessmentQuestionsSection
        questions={props.questions}
        orderedQuestions={props.orderedQuestions}
        selectedIds={draft.selectedIds}
        questionSearch={props.questionSearch}
        subjectFilter={props.subjectFilter}
        lessonFilter={props.lessonFilter}
        difficultyFilter={props.difficultyFilter}
        hasLegacyQuestions={props.hasLegacyQuestions}
        locked={locked}
        onQuestionSearchChange={props.onQuestionSearchChange}
        onSubjectFilterChange={props.onSubjectFilterChange}
        onLessonFilterChange={props.onLessonFilterChange}
        onDifficultyFilterChange={props.onDifficultyFilterChange}
        onSelectedIdsChange={(values) => onDraftChange("selectedIds", values)}
        onMoveQuestion={props.onMoveQuestion}
        onRemoveQuestion={props.onRemoveQuestion}
      />
      {props.validationError ? (
        <Alert tone="info">{t(`validation.${props.validationError}`)}</Alert>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={!canSubmit}
          loading={props.pending}
          onClick={props.onSaveDraft}
        >
          {t(props.isEdit ? "saveChanges" : "saveDraft")}
        </Button>
        {props.isDraftStatus ? (
          <Button disabled={!canSubmit} loading={props.pending} onClick={props.onSaveAndPublish}>
            {t("saveAndPublish")}
          </Button>
        ) : null}
      </div>
      <ConfirmDialog
        open={props.leaveBlocked}
        onOpenChange={props.onCancelLeave}
        title={t("leaveTitle")}
        description={t("leaveDescription")}
        closeLabel={t("closeDialog")}
        cancelLabel={t("leaveStay")}
        confirmLabel={t("leaveConfirm")}
        onConfirm={props.onConfirmLeave}
      />
    </section>
  );
}

import { useTranslation } from "react-i18next";
import type { Question } from "@noldg/api/contracts/assessments";
import {
  Alert,
  Breadcrumbs,
  Button,
  Heading,
  OrderList,
  RadioGroup,
  SearchableMultiSelect,
  TextField,
} from "@noldg/ui";
import { AssessmentScheduleFields } from "./AssessmentScheduleFields";

interface AssessmentBuilderFormProps {
  courseId: string;
  type: "exam" | "homework";
  questions: readonly Question[];
  orderedQuestions: readonly { id: string; label: string }[];
  selectedIds: readonly string[];
  title: string;
  duration: string;
  maxAttempts: string;
  start: string;
  end: string;
  questionSearch: string;
  pending: boolean;
  onTitleChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onMaxAttemptsChange: (value: string) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onQuestionSearchChange: (value: string) => void;
  onSelectedIdsChange: (values: readonly string[]) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onRemoveQuestion: (id: string) => void;
  onSubmit: () => void;
}

/** Renders the assessment builder form with translated controls and ordered question selection.
 * @param props Form values and event handlers owned by the feature hook/page.
 */
export function AssessmentBuilderForm(props: AssessmentBuilderFormProps) {
  const { t } = useTranslation("assessments");
  return (
    <section className="space-y-5">
      <Breadcrumbs
        label={t("breadcrumbs")}
        items={[
          { label: t("course"), to: `/teacher/courses/${encodeURIComponent(props.courseId)}` },
          { label: t("builderTitle", { type: t(props.type) }) },
        ]}
      />
      <Heading level={1}>{t("builderTitle", { type: t(props.type) })}</Heading>
      <TextField
        id="assessment-title"
        label={t("titleLabel")}
        value={props.title}
        onChange={(event) => props.onTitleChange(event.currentTarget.value)}
        required
      />
      <AssessmentScheduleFields
        type={props.type}
        start={props.start}
        end={props.end}
        duration={props.duration}
        maxAttempts={props.maxAttempts}
        onStartChange={props.onStartChange}
        onEndChange={props.onEndChange}
        onDurationChange={props.onDurationChange}
        onMaxAttemptsChange={props.onMaxAttemptsChange}
      />
      <RadioGroup
        id="assessment-audience"
        label={t("audienceLabel")}
        value="all_course_students"
        options={[{ value: "all_course_students", label: t("allStudents") }]}
      />
      <Alert tone="info">{t("audienceTargetingNotice")}</Alert>
      <SearchableMultiSelect
        id="assessment-questions"
        label={t("questionsLabel")}
        searchLabel={t("questionSearchLabel")}
        searchValue={props.questionSearch}
        onSearchChange={props.onQuestionSearchChange}
        options={props.questions.map((question) => ({ value: question.id, label: question.text }))}
        selectedValues={props.selectedIds}
        selectedSummary={t("selectedQuestionCount", { count: props.selectedIds.length })}
        onSelectedValuesChange={props.onSelectedIdsChange}
        emptyLabel={t("noQuestions")}
        loadingLabel={t("loadingQuestions")}
      />
      <OrderList
        label={t("orderedQuestions")}
        items={props.orderedQuestions}
        emptyLabel={t("selectQuestionsFirst")}
        moveUpLabel={(label) => t("moveUp", { label })}
        moveDownLabel={(label) => t("moveDown", { label })}
        removeLabel={(label) => t("removeQuestion", { label })}
        onMove={props.onMoveQuestion}
        onRemove={props.onRemoveQuestion}
      />
      <Button
        disabled={
          props.pending ||
          !props.title.trim() ||
          !props.selectedIds.length ||
          !props.start ||
          !props.end
        }
        loading={props.pending}
        onClick={props.onSubmit}
      >
        {t("saveDraft")}
      </Button>
    </section>
  );
}

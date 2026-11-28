import { useTranslation } from "react-i18next";
import type { Question } from "@noldg/api/contracts/assessments";
import { Alert, OrderList, SearchableMultiSelect, Select, Text, TextField } from "@noldg/ui";

interface AssessmentQuestionsSectionProps {
  questions: readonly Question[];
  orderedQuestions: readonly { id: string; label: string }[];
  selectedIds: readonly string[];
  questionSearch: string;
  subjectFilter: string;
  lessonFilter: string;
  difficultyFilter: string;
  hasLegacyQuestions: boolean;
  locked: boolean;
  onQuestionSearchChange: (value: string) => void;
  onSubjectFilterChange: (value: string) => void;
  onLessonFilterChange: (value: string) => void;
  onDifficultyFilterChange: (value: string) => void;
  onSelectedIdsChange: (values: readonly string[]) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onRemoveQuestion: (id: string) => void;
}

/** Renders bank filters, multi-selection, and accessible up/down ordering for assessment questions.
 * @param props Filtered question entries, ordering state, lock status, and filter/order handlers.
 */
export function AssessmentQuestionsSection(props: AssessmentQuestionsSectionProps) {
  const { t } = useTranslation("assessments");
  return (
    <section className="space-y-4">
      {props.hasLegacyQuestions ? <Alert tone="info">{t("legacyQuestionsNotice")}</Alert> : null}
      <div className="grid gap-3 md:grid-cols-3">
        <TextField
          id="assessment-filter-subject"
          label={t("filterSubject")}
          value={props.subjectFilter}
          disabled={props.locked}
          onChange={(event) => props.onSubjectFilterChange(event.currentTarget.value)}
        />
        <TextField
          id="assessment-filter-lesson"
          label={t("filterLesson")}
          value={props.lessonFilter}
          disabled={props.locked}
          onChange={(event) => props.onLessonFilterChange(event.currentTarget.value)}
        />
        <Select
          id="assessment-filter-difficulty"
          label={t("filterDifficulty")}
          value={props.difficultyFilter}
          disabled={props.locked}
          onValueChange={props.onDifficultyFilterChange}
          placeholder={t("allDifficulties")}
          options={[
            { value: "all", label: t("allDifficulties") },
            { value: "easy", label: t("easy") },
            { value: "medium", label: t("medium") },
            { value: "hard", label: t("hard") },
          ]}
        />
      </div>
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
        disabled={props.locked}
      />
      {props.locked ? (
        <ol className="space-y-2">
          {props.orderedQuestions.map((item) => (
            <li key={item.id} className="rounded-md border border-border bg-surface p-3">
              <Text>{item.label}</Text>
            </li>
          ))}
        </ol>
      ) : (
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
      )}
    </section>
  );
}

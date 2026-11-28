import { useTranslation } from "react-i18next";
import type { CourseStudent } from "@noldg/api/contracts/assessments";
import { capabilities } from "@noldg/api/config/capabilities";
import { Alert, RadioGroup, SearchableMultiSelect } from "@noldg/ui";

interface AssessmentAudienceFieldsProps {
  targetMode: "all_course_students" | "selected_students";
  studentIds: readonly string[];
  students: readonly CourseStudent[];
  studentsLoading: boolean;
  studentSearch: string;
  locked: boolean;
  onTargetModeChange: (value: "all_course_students" | "selected_students") => void;
  onStudentIdsChange: (values: readonly string[]) => void;
  onStudentSearchChange: (value: string) => void;
}

/** Renders course-wide or selected-student audience targeting controls.
 * @param props Targeting mode, course student roster, search state, lock status, and handlers.
 */
export function AssessmentAudienceFields(props: AssessmentAudienceFieldsProps) {
  const { t } = useTranslation("assessments");
  const targetingEnabled = capabilities.assessmentTargeting;
  return (
    <section className="space-y-3">
      <RadioGroup
        id="assessment-audience"
        label={t("audienceLabel")}
        value={props.targetMode}
        disabled={props.locked}
        onValueChange={(value) =>
          props.onTargetModeChange(
            value === "selected_students" ? "selected_students" : "all_course_students",
          )
        }
        options={
          targetingEnabled
            ? [
                { value: "all_course_students", label: t("allStudents") },
                { value: "selected_students", label: t("selectedStudents") },
              ]
            : [{ value: "all_course_students", label: t("allStudents") }]
        }
      />
      {!targetingEnabled ? <Alert tone="info">{t("audienceTargetingNotice")}</Alert> : null}
      {targetingEnabled && props.targetMode === "selected_students" ? (
        <SearchableMultiSelect
          id="assessment-target-students"
          label={t("selectedStudentsLabel")}
          searchLabel={t("studentSearchLabel")}
          searchValue={props.studentSearch}
          onSearchChange={props.onStudentSearchChange}
          options={props.students.map((student) => ({
            value: student.id,
            label: student.name,
          }))}
          selectedValues={props.studentIds}
          selectedSummary={t("selectedStudentCount", { count: props.studentIds.length })}
          onSelectedValuesChange={props.onStudentIdsChange}
          emptyLabel={t("noStudents")}
          loadingLabel={t("loadingStudents")}
          loading={props.studentsLoading}
          disabled={props.locked}
        />
      ) : null}
    </section>
  );
}

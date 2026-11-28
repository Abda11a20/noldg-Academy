import { useTranslation } from "react-i18next";
import { DateTimeField, NumberField } from "@noldg/ui";
import {
  ASSESSMENT_MAX_ATTEMPTS,
  ASSESSMENT_MAX_DURATION_MINUTES,
  ASSESSMENT_MIN_ATTEMPTS,
  ASSESSMENT_MIN_DURATION_MINUTES,
} from "../constants";
import type { EditableAssessmentType } from "../utils/builder-validation";

interface AssessmentScheduleFieldsProps {
  type: EditableAssessmentType;
  start: string;
  end: string;
  duration: string;
  maxAttempts: string;
  locked: boolean;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onMaxAttemptsChange: (value: string) => void;
}

/** Renders type-specific Cairo schedule and exam duration/attempt fields.
 * @param props Current form values, lock status after first attempt, and change events.
 */
export function AssessmentScheduleFields(props: AssessmentScheduleFieldsProps) {
  const { t } = useTranslation("assessments");
  const isExam = props.type === "exam";
  const hint = isExam ? t("cairoHint") : t("dayHint");
  const mode = isExam ? "datetime" : "date";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DateTimeField
        id="assessment-start"
        label={isExam ? t("startLabel") : t("startDayLabel")}
        mode={mode}
        hint={hint}
        value={props.start}
        disabled={props.locked}
        onChange={(event) => props.onStartChange(event.currentTarget.value)}
        required
      />
      <DateTimeField
        id="assessment-end"
        label={isExam ? t("endLabel") : t("endDayLabel")}
        mode={mode}
        hint={hint}
        value={props.end}
        onChange={(event) => props.onEndChange(event.currentTarget.value)}
        required
      />
      {isExam ? (
        <>
          <NumberField
            id="assessment-duration"
            label={t("durationLabel")}
            min={ASSESSMENT_MIN_DURATION_MINUTES}
            max={ASSESSMENT_MAX_DURATION_MINUTES}
            value={props.duration}
            disabled={props.locked}
            onChange={(event) => props.onDurationChange(event.currentTarget.value)}
            required
          />
          <NumberField
            id="assessment-attempts"
            label={t("attemptsLabel")}
            min={ASSESSMENT_MIN_ATTEMPTS}
            max={ASSESSMENT_MAX_ATTEMPTS}
            value={props.maxAttempts}
            disabled={props.locked}
            onChange={(event) => props.onMaxAttemptsChange(event.currentTarget.value)}
            required
          />
        </>
      ) : null}
    </div>
  );
}

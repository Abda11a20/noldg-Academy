import { useTranslation } from "react-i18next";
import { DateTimeField, NumberField } from "@noldg/ui";
import { ASSESSMENT_MAX_DURATION_MINUTES, ASSESSMENT_MIN_DURATION_MINUTES } from "../constants";

interface AssessmentScheduleFieldsProps {
  type: "exam" | "homework";
  start: string;
  end: string;
  duration: string;
  maxAttempts: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onMaxAttemptsChange: (value: string) => void;
}

/** Renders type-specific Cairo schedule and exam rule fields.
 * @param props Current form values and change events.
 */
export function AssessmentScheduleFields(props: AssessmentScheduleFieldsProps) {
  const { t } = useTranslation("assessments");
  const hint = props.type === "exam" ? t("cairoHint") : t("dayHint");
  return (
    <>
      <DateTimeField
        id="assessment-start"
        label={t("startLabel")}
        hint={hint}
        value={props.start}
        onChange={(event) => props.onStartChange(event.currentTarget.value)}
        required
      />
      <DateTimeField
        id="assessment-end"
        label={t("endLabel")}
        hint={hint}
        value={props.end}
        onChange={(event) => props.onEndChange(event.currentTarget.value)}
        required
      />
      {props.type === "exam" ? (
        <>
          <NumberField
            id="assessment-duration"
            label={t("durationLabel")}
            min={ASSESSMENT_MIN_DURATION_MINUTES}
            max={ASSESSMENT_MAX_DURATION_MINUTES}
            value={props.duration}
            onChange={(event) => props.onDurationChange(event.currentTarget.value)}
            required
          />
          <NumberField
            id="assessment-attempts"
            label={t("attemptsLabel")}
            min={ASSESSMENT_MIN_DURATION_MINUTES}
            max={ASSESSMENT_MAX_DURATION_MINUTES}
            value={props.maxAttempts}
            onChange={(event) => props.onMaxAttemptsChange(event.currentTarget.value)}
            required
          />
        </>
      ) : null}
    </>
  );
}

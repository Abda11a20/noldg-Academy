import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import { Alert, Heading, NumberField, RadioGroup, Switch } from "@noldg/ui";
import { ASSESSMENT_MAX_RANDOM_COUNT, ASSESSMENT_MAX_TAB_LEAVES } from "../constants";

interface AssessmentRulesFieldsProps {
  shuffle: boolean;
  randomCount: string;
  poolSize: number;
  showResults: "immediate" | "after_close";
  maxTabLeaves: string;
  locked: boolean;
  onShuffleChange: (value: boolean) => void;
  onRandomCountChange: (value: string) => void;
  onShowResultsChange: (value: "immediate" | "after_close") => void;
  onMaxTabLeavesChange: (value: string) => void;
}

/** Renders assessment shuffling, random pool sizing, result timing, and tab-leave controls.
 * @param props Rule values, selected pool count for live warnings, lock state, and handlers.
 */
export function AssessmentRulesFields(props: AssessmentRulesFieldsProps) {
  const { t } = useTranslation("assessments");
  const parsedRandom = Number(props.randomCount.trim());
  const poolTooSmall =
    Boolean(props.randomCount.trim()) &&
    Number.isInteger(parsedRandom) &&
    parsedRandom > props.poolSize;
  return (
    <section className="space-y-4">
      <Heading level={2}>{t("rulesHeading")}</Heading>
      {capabilities.assessmentShuffle ? (
        <Switch
          id="assessment-shuffle"
          label={t("shuffleLabel")}
          checked={props.shuffle}
          disabled={props.locked}
          onCheckedChange={props.onShuffleChange}
        />
      ) : null}
      {capabilities.assessmentRandomPool ? (
        <div className="space-y-2">
          <NumberField
            id="assessment-random-count"
            label={t("randomCountLabel")}
            hint={t("randomCountHint")}
            min={1}
            max={ASSESSMENT_MAX_RANDOM_COUNT}
            value={props.randomCount}
            disabled={props.locked}
            onChange={(event) => props.onRandomCountChange(event.currentTarget.value)}
          />
          {poolTooSmall ? (
            <Alert tone="warning" role="alert">
              {t("poolTooSmallWarning", {
                randomCount: parsedRandom,
                poolSize: props.poolSize,
              })}
            </Alert>
          ) : null}
        </div>
      ) : null}
      <RadioGroup
        id="assessment-show-results"
        label={t("showResultsLabel")}
        value={props.showResults}
        disabled={props.locked}
        onValueChange={(value) =>
          props.onShowResultsChange(value === "after_close" ? "after_close" : "immediate")
        }
        options={[
          { value: "immediate", label: t("showImmediate") },
          { value: "after_close", label: t("showAfterClose") },
        ]}
      />
      <NumberField
        id="assessment-max-tab-leaves"
        label={t("maxTabLeavesLabel")}
        hint={t("maxTabLeavesHint")}
        min={0}
        max={ASSESSMENT_MAX_TAB_LEAVES}
        value={props.maxTabLeaves}
        disabled={props.locked}
        onChange={(event) => props.onMaxTabLeavesChange(event.currentTarget.value)}
      />
    </section>
  );
}

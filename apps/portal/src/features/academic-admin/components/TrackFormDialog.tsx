import { zodResolver } from "@hookform/resolvers/zod";
import { TrackInputSchema, type AcademicTrack } from "@noldg/api/contracts/admin";
import { ACADEMIC_GRADES, ACADEMIC_STAGES, ACADEMIC_SYSTEMS } from "@noldg/api/constants/admin";
import { useForm, useWatch } from "react-hook-form";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Select, TextField } from "@noldg/ui";
import { ACADEMIC_STAGE_LABEL_KEYS, ACADEMIC_SYSTEM_LABEL_KEYS } from "../translation-keys";

interface TrackFields {
  system: AcademicTrack["system"];
  stage: AcademicTrack["stage"];
  grade: number;
  name: string;
}
export interface TrackFormDialogProps {
  open: boolean;
  track?: AcademicTrack;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (fields: TrackFields) => void;
}

function trackDefaults(track?: AcademicTrack): TrackFields {
  return {
    system: track?.system ?? "general",
    stage: track?.stage ?? "prep",
    grade: track?.grade ?? 1,
    name: track?.name ?? "",
  };
}

/** Edits or creates a track and validates target academic rules before submitting.
 * @param props Dialog state, optional record, save state, and event callbacks.
 */
export function TrackFormDialog({
  open,
  track,
  pending,
  onOpenChange,
  onSave,
}: TrackFormDialogProps) {
  const { t } = useTranslation("admin");
  const form = useForm<TrackFields>({
    resolver: zodResolver(TrackInputSchema),
    defaultValues: trackDefaults(track),
  });
  const systemOptions = ACADEMIC_SYSTEMS.map((system) => ({
    value: system,
    label: t(ACADEMIC_SYSTEM_LABEL_KEYS[system]),
  }));
  const selectedSystem = useWatch({ control: form.control, name: "system" });
  const stageOptions = ACADEMIC_STAGES.filter(
    (stage) => selectedSystem !== "american_diploma" || stage === "secondary",
  ).map((stage) => ({ value: stage, label: t(ACADEMIC_STAGE_LABEL_KEYS[stage]) }));
  const gradeOptions = ACADEMIC_GRADES.map((grade) => ({
    value: String(grade),
    label: String(grade),
  }));
  const selectedStage = useWatch({ control: form.control, name: "stage" });
  const selectedGrade = useWatch({ control: form.control, name: "grade" });
  const submit = form.handleSubmit((fields) => onSave(fields));
  const title = track ? t("academic.actions.edit") : t("academic.actions.createTrack");
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };
  const setSystem = (value: string) =>
    form.setValue("system", value as TrackFields["system"], { shouldValidate: true });
  const setStage = (value: string) =>
    form.setValue("stage", value as TrackFields["stage"], { shouldValidate: true });
  const setGrade = (value: string) =>
    form.setValue("grade", Number(value), { shouldValidate: true });
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      closeLabel={t("common.close")}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} variant="secondary">
            {t("academic.actions.cancel")}
          </Button>
          <Button disabled={pending} form="track-form" loading={pending} type="submit">
            {t("academic.actions.save")}
          </Button>
        </>
      }
    >
      <form className="space-y-4" id="track-form" onSubmit={save}>
        <Select
          id="track-system"
          label={t("academic.fields.system")}
          options={systemOptions}
          value={selectedSystem}
          placeholder={t("academic.filters.system")}
          onValueChange={setSystem}
        />
        <Select
          id="track-stage"
          label={t("academic.fields.stage")}
          options={stageOptions}
          value={selectedStage}
          placeholder={t("academic.filters.stage")}
          onValueChange={setStage}
        />
        <Select
          id="track-grade"
          label={t("academic.fields.grade")}
          options={gradeOptions}
          value={String(selectedGrade)}
          placeholder={t("academic.fields.grade")}
          onValueChange={setGrade}
        />
        <TextField id="track-name" label={t("academic.fields.name")} {...form.register("name")} />
        {form.formState.errors.stage ? (
          <p className="text-sm text-danger">{t("academic.states.americanStage")}</p>
        ) : null}
      </form>
    </Dialog>
  );
}

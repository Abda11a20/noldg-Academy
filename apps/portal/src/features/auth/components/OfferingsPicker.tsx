import { useTranslation } from "react-i18next";
import { Button, Checkbox, Chip, Stack, Text } from "@noldg/ui";
import type { AcademicCatalog } from "@noldg/api/contracts/auth";
import { CatalogSystemSelect } from "./CatalogSystemSelect";
import type { TeacherOfferingSelection } from "../hooks/useRegistration";

export interface OfferingsPickerProps {
  catalog?: AcademicCatalog;
  system: string;
  trackIds: readonly string[];
  subjectIds: readonly string[];
  offerings: readonly TeacherOfferingSelection[];
  error?: string;
  onSystemChange: (system: string) => void;
  onTrackToggle: (id: string) => void;
  onSubjectToggle: (id: string) => void;
  onAdd: () => void;
  onRemove: (trackId: string, subjectId: string) => void;
}

/** Lets teachers choose tracks and their subjects, then review removable offerings. @param props Catalog data, values, errors, and events. */
export function OfferingsPicker({
  catalog,
  system,
  trackIds,
  subjectIds,
  offerings,
  error,
  onSystemChange,
  onTrackToggle,
  onSubjectToggle,
  onAdd,
  onRemove,
}: OfferingsPickerProps) {
  const { t } = useTranslation("auth");
  const tracks = catalog?.tracks.filter((track) => track.system === system) ?? [];
  const subjects = tracks
    .filter((track) => trackIds.includes(track.id))
    .flatMap((track) => track.subjects.map((subject) => ({ ...subject, trackId: track.id })));
  const trackOptions = tracks.map((track) => ({ value: track.id, label: track.name }));
  const offeringsBySystem = new Map<string, TeacherOfferingSelection[]>();
  offerings.forEach((offering) => {
    offeringsBySystem.set(offering.system, [
      ...(offeringsBySystem.get(offering.system) ?? []),
      offering,
    ]);
  });
  return (
    <Stack className="gap-4">
      <CatalogSystemSelect
        id="teacher-system"
        label={t("teacher.system")}
        onChange={onSystemChange}
        systems={catalog?.systems ?? []}
        value={system}
      />
      {system ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium text-foreground">{t("teacher.grades")}</legend>
          {trackOptions.map((track) => (
            <Checkbox
              checked={trackIds.includes(track.value)}
              id={`offering-track-${track.value}`}
              key={track.value}
              label={track.label}
              onCheckedChange={() => onTrackToggle(track.value)}
            />
          ))}
        </fieldset>
      ) : null}
      {trackIds.length ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-medium text-foreground">{t("teacher.subjects")}</legend>
          {subjects.length ? (
            subjects.map((subject) => (
              <Checkbox
                checked={subjectIds.includes(subject.id)}
                id={`offering-subject-${subject.id}`}
                key={`${subject.trackId}-${subject.id}`}
                label={subject.name}
                onCheckedChange={() => onSubjectToggle(subject.id)}
              />
            ))
          ) : (
            <Text tone="muted">{t("emptySubjects")}</Text>
          )}
        </fieldset>
      ) : null}
      <Button disabled={!subjectIds.length} onClick={onAdd} variant="secondary">
        {t("teacher.addOffering")}
      </Button>
      {error ? <Text tone="danger">{error}</Text> : null}
      <div aria-label={t("teacher.selectedOfferings")} className="flex flex-wrap gap-2" role="list">
        {[...offeringsBySystem].map(([systemName, systemOfferings]) => (
          <div className="flex flex-wrap gap-2" key={systemName}>
            <Text className="basis-full" tone="muted">
              {t(`systemNames.${systemName}`, { defaultValue: systemName })}
            </Text>
            {systemOfferings.map((offering) => (
              <span key={`${offering.trackId}-${offering.subjectId}`} role="listitem">
                <Chip
                  onRemove={() => onRemove(offering.trackId, offering.subjectId)}
                  removeLabel={t("teacher.removeOffering", { subject: offering.subjectName })}
                >
                  {`${offering.trackName} · ${offering.subjectName}`}
                </Chip>
              </span>
            ))}
          </div>
        ))}
      </div>
    </Stack>
  );
}

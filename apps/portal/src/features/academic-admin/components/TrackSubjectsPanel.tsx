import { Button, Chip, Select, Skeleton } from "@noldg/ui";
import { useTrackSubjectsPanel } from "../hooks/useTrackSubjectsPanel";

/** Renders the current subjects for a selected track and mapping controls.
 * @returns Track-subject mapping panel.
 */
export function TrackSubjectsPanel() {
  const state = useTrackSubjectsPanel();
  const { t, queries } = state;
  if (queries.tracks.isLoading || queries.subjects.isLoading) return <Skeleton className="h-32" />;
  return (
    <div className="space-y-4">
      <Select
        id="mapping-track"
        label={t("academic.fields.track")}
        options={state.trackOptions}
        placeholder={t("academic.fields.track")}
        value={state.trackId}
        onValueChange={state.setTrackId}
      />
      {state.trackId ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            id="mapping-subject"
            label={t("academic.fields.subject")}
            options={state.subjectOptions}
            placeholder={t("academic.fields.subject")}
            value={state.subjectId}
            onValueChange={state.setSubjectId}
          />
          <Button
            disabled={!state.subjectId || state.mutations.linkMutation.isPending}
            loading={state.mutations.linkMutation.isPending}
            onClick={state.addSubject}
          >
            {t("academic.actions.addSubject")}
          </Button>
        </div>
      ) : null}
      {queries.trackSubjects.isLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {(queries.trackSubjects.data ?? []).map((subject) => (
            <Chip
              key={subject.id}
              removeLabel={t("academic.actions.removeSubject")}
              onRemove={() => state.removeSubject(subject.id)}
            >
              {subject.name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

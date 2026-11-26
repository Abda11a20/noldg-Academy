import { useTrackSubjectsPanel } from "../hooks/useTrackSubjectsPanel";
import { TrackSubjectsBody } from "./TrackSubjectsBody";

/** Renders the current subjects for a selected track and mapping controls.
 * @returns Track-subject mapping panel.
 */
export function TrackSubjectsPanel() {
  const state = useTrackSubjectsPanel();
  return (
    <TrackSubjectsBody
      addSubject={state.addSubject}
      error={
        state.queries.tracks.error ??
        state.queries.subjects.error ??
        state.queries.trackSubjects.error
      }
      isLoading={state.queries.tracks.isLoading || state.queries.subjects.isLoading}
      isMappingLoading={state.queries.trackSubjects.isLoading}
      mappings={state.queries.trackSubjects.data ?? []}
      onRemove={state.removeSubject}
      onSelectSubject={state.setSubjectId}
      onSelectTrack={state.setTrackId}
      subjectId={state.subjectId}
      subjectOptions={state.subjectOptions}
      trackId={state.trackId}
      trackOptions={state.trackOptions}
      labels={{
        track: state.t("academic.fields.track"),
        subject: state.t("academic.fields.subject"),
        addSubject: state.t("academic.actions.addSubject"),
        removeSubject: state.t("academic.actions.removeSubject"),
        forbiddenTitle: state.t("academic.states.forbiddenTitle"),
        forbiddenBody: state.t("academic.states.forbiddenBody"),
        unavailableTitle: state.t("academic.states.unavailableTitle"),
        unavailableBody: state.t("academic.states.unavailableBody"),
      }}
      addPending={state.mutations.linkMutation.isPending}
    />
  );
}

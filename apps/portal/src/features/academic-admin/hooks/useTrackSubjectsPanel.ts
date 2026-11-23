import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { useAcademicQueries } from "./useAcademicQueries";
import { useAcademicMutations } from "./useAcademicMutations";

/** Owns selection and mutations for track-to-subject mappings.
 * @returns Selected values, query data, and mutation handlers.
 */
export function useTrackSubjectsPanel() {
  const { t } = useTranslation("admin");
  const list = useListUrlState();
  const [trackId, setTrackId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const queries = useAcademicQueries(list.state, trackId);
  const mutations = useAcademicMutations();
  const trackOptions = (queries.tracks.data?.items ?? []).map((track) => ({
    value: track.id,
    label: track.name,
  }));
  const subjectOptions = (queries.subjects.data?.items ?? [])
    .filter(
      (subject) =>
        subject.active && !queries.trackSubjects.data?.some((mapped) => mapped.id === subject.id),
    )
    .map((subject) => ({ value: subject.id, label: subject.name }));
  const addSubject = () => {
    if (!trackId || !subjectId) return;
    mutations.linkMutation.mutate({ trackId, subjectId }, { onSuccess: () => setSubjectId("") });
  };
  const removeSubject = (id: string) => mutations.unlinkMutation.mutate({ trackId, subjectId: id });
  return {
    t,
    trackId,
    setTrackId,
    subjectId,
    setSubjectId,
    queries,
    mutations,
    trackOptions,
    subjectOptions,
    addSubject,
    removeSubject,
  };
}

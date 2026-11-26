import type { ListUrlState } from "@noldg/api/contracts/common";

export const academicQueryKeys = {
  all: ["academic"] as const,
  tracks: () => [...academicQueryKeys.all, "tracks"] as const,
  trackList: (state: ListUrlState) => [...academicQueryKeys.tracks(), state] as const,
  subjects: () => [...academicQueryKeys.all, "subjects"] as const,
  subjectList: (state: ListUrlState) => [...academicQueryKeys.subjects(), state] as const,
  trackSubjects: (trackId: string) => [...academicQueryKeys.tracks(), trackId, "subjects"] as const,
};

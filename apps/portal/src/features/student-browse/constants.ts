export const STUDENT_BROWSE_DEFAULT_PAGE_SIZE = 12;
export const STUDENT_BROWSE_PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
export const STUDENT_BROWSE_SORTS = ["newest", "rating", "priceAsc", "priceDesc"] as const;
export const STUDENT_BROWSE_RATINGS = ["3", "4", "4.5"] as const;
export const STUDENT_BROWSE_TRACKS = [
  { id: "track-secondary-1", labelKey: "tracks.generalFirstSecondary" },
  { id: "track-general-secondary-2", labelKey: "tracks.generalSecondSecondary" },
  { id: "track-general-prep-3", labelKey: "tracks.generalThirdPreparatory" },
  { id: "track-azhar-secondary-1", labelKey: "tracks.azharFirstSecondary" },
] as const;
export const STUDENT_BROWSE_SUBJECTS = [
  { id: "subject-math", labelKey: "subjects.mathematics" },
  { id: "subject-arabic", labelKey: "subjects.arabic" },
  { id: "subject-physics", labelKey: "subjects.physics" },
  { id: "subject-chemistry", labelKey: "subjects.chemistry" },
  { id: "subject-english", labelKey: "subjects.english" },
  { id: "subject-biology", labelKey: "subjects.biology" },
] as const;

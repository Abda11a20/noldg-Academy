import type { AcademicStage, AcademicSystem } from "@noldg/api/contracts/admin";

export const ACADEMIC_SYSTEM_LABEL_KEYS: Record<
  AcademicSystem,
  | "academic.systems.general"
  | "academic.systems.languages"
  | "academic.systems.azhar"
  | "academic.systems.egyptian_bacc"
  | "academic.systems.american_diploma"
> = {
  general: "academic.systems.general",
  languages: "academic.systems.languages",
  azhar: "academic.systems.azhar",
  egyptian_bacc: "academic.systems.egyptian_bacc",
  american_diploma: "academic.systems.american_diploma",
};
export const ACADEMIC_STAGE_LABEL_KEYS: Record<
  AcademicStage,
  "academic.stages.prep" | "academic.stages.secondary"
> = { prep: "academic.stages.prep", secondary: "academic.stages.secondary" };

import type { ListUrlState } from "@noldg/api/contracts/common";

export const teacherApplicationQueryKeys = {
  all: ["teacher-administration"] as const,
  applications: () => [...teacherApplicationQueryKeys.all, "applications"] as const,
  applicationList: (state: ListUrlState, status: string) =>
    [...teacherApplicationQueryKeys.applications(), state, status] as const,
  application: (id: string) => [...teacherApplicationQueryKeys.applications(), id] as const,
  accounts: () => [...teacherApplicationQueryKeys.all, "accounts"] as const,
  accountList: (state: ListUrlState, status: string) =>
    [...teacherApplicationQueryKeys.accounts(), state, status] as const,
};

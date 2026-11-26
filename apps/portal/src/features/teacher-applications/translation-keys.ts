import type { TeacherApplication } from "@noldg/api/contracts/admin";

export const APPLICATION_STATUS_LABEL_KEYS: Record<
  TeacherApplication["status"],
  "teachers.statuses.pending" | "teachers.statuses.approved" | "teachers.statuses.rejected"
> = {
  pending: "teachers.statuses.pending",
  approved: "teachers.statuses.approved",
  rejected: "teachers.statuses.rejected",
};
export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;

import type { TeacherApplication } from "../contracts/admin";

export const mockPendingTeacherState: {
  status: TeacherApplication["status"];
  rejectionReason?: string | undefined;
} = {
  status: "pending",
};

/** Restores the shared teacher application state between isolated mock tests.
 */
export function resetMockPendingTeacherState(): void {
  mockPendingTeacherState.status = "pending";
  delete mockPendingTeacherState.rejectionReason;
}

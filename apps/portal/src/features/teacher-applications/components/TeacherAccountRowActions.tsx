import type { UserSummary } from "@noldg/api/contracts/admin";
import { DropdownMenu, Icon } from "@noldg/ui";

export interface TeacherAccountRowActionsProps {
  account: UserSummary;
  actionLabel: string;
  nextStatus: "active" | "suspended";
  onSelect: (account: UserSummary) => void;
}

/** Renders one account's suspend/reactivate dropdown action.
 * @param props Account, translated label, target status, and selection callback.
 */
export function TeacherAccountRowActions({
  account,
  actionLabel,
  nextStatus,
  onSelect,
}: TeacherAccountRowActionsProps) {
  return (
    <DropdownMenu
      trigger={<Icon name="menu" />}
      triggerLabel={actionLabel}
      items={[
        {
          id: nextStatus,
          label: actionLabel,
          tone: nextStatus === "suspended" ? "danger" : "default",
          onSelect: () => onSelect(account),
        },
      ]}
    />
  );
}

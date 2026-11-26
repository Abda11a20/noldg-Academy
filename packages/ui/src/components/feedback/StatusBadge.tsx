import type { HTMLAttributes } from "react";
import { Badge } from "./Badge";

type OrderStatus = "awaiting_payment" | "completed" | "rejected" | "expired" | "cancelled";
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: OrderStatus;
  labels: Readonly<Record<OrderStatus, string>>;
}

const statusTone = {
  awaiting_payment: "warning",
  completed: "success",
  rejected: "danger",
  expired: "neutral",
  cancelled: "neutral",
} as const;

/** Renders a payment lifecycle status using a semantic badge tone.
 * @param props Status, localized labels, and span attributes.
 */
export function StatusBadge({ status, labels, ...props }: StatusBadgeProps) {
  return (
    <Badge tone={statusTone[status]} {...props}>
      {labels[status]}
    </Badge>
  );
}

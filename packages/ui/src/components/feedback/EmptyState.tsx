import type { ReactNode } from "react";
import type { IconName } from "../../icons";
import { Icon } from "../icon/Icon";
export interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}
/** Shows a supplied icon and copy when a collection has no items. @param props Empty-state presentation and optional action. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center gap-3 p-8 text-center">
      <Icon name={icon} size="lg" color="muted" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="max-w-prose text-foreground-muted">{description}</p>
      {action}
    </section>
  );
}

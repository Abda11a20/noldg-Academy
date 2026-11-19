import type { ReactNode } from "react";
import { Button } from "../button/Button";

export interface ChipProps {
  children: ReactNode;
  removeLabel: string;
  onRemove: () => void;
  disabled?: boolean;
}

/** Renders a removable, accessible selection chip. @param props Chip text, remove label, and event. */
export function Chip({ children, removeLabel, onRemove, disabled = false }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-muted ps-3 pe-1 py-1 text-sm text-foreground">
      {children}
      <Button
        aria-label={removeLabel}
        disabled={disabled}
        iconOnly
        iconStart="close"
        onClick={onRemove}
        size="sm"
        variant="ghost"
      />
    </span>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { Button } from "./Button";

export interface CopyButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "onCopy"
> {
  value: string;
  label: string;
  copiedLabel: string;
  copied: boolean;
  onCopy: (value: string) => void;
}

/** Requests a copy action and announces its completion through a live region.
 * @param props Value, labels, completion state, and copy event.
 */
export function CopyButton({
  value,
  label,
  copiedLabel,
  copied,
  onCopy,
  ...props
}: CopyButtonProps) {
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => onCopy(value)} {...props}>
        {label}
      </Button>
      <span aria-live="polite" className="sr-only" role="status">
        {copied ? copiedLabel : ""}
      </span>
    </>
  );
}

import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "../icon/Icon";
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}
const tones = {
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
} as const;
const icons = { info: "info", success: "success", warning: "alert", danger: "alert" } as const;
/** Announces a contextual message and optional action. @param props Tone, text, and action slot. */
export function Alert({ tone, title, children, action, className = "", ...props }: AlertProps) {
  return (
    <div
      aria-live={tone === "danger" ? "assertive" : "polite"}
      className={`flex gap-3 rounded-md p-4 ${tones[tone]} ${className}`.trim()}
      role={tone === "danger" ? "alert" : "status"}
      {...props}
    >
      <Icon name={icons[tone]} />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}

import type { HTMLAttributes } from "react";

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  steps: readonly string[];
  currentStep: number;
  label: string;
}

/** Renders a labelled, ordered progress indicator.
 * @param props Step labels, one-based active step, and accessible label.
 */
export function Stepper({ steps, currentStep, label, className = "", ...props }: StepperProps) {
  return (
    <ol aria-label={label} className={`flex items-start ${className}`.trim()} {...props}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        return (
          <li
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-1 items-center gap-2"
            key={`${stepNumber}-${step}`}
          >
            <span
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${isComplete || isCurrent ? "bg-primary text-primary-foreground" : "bg-surface-muted text-foreground-muted"}`}
            >
              {stepNumber}
            </span>
            <span className="text-sm text-foreground">{step}</span>
            {stepNumber < steps.length ? (
              <span aria-hidden="true" className="mx-2 h-px flex-1 bg-border" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

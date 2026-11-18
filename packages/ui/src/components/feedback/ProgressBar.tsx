import "./ProgressBar.css";

export interface ProgressBarProps {
  label: string;
  value?: number;
}
/** Displays determinate progress or an indeterminate progress indicator. @param props Accessible label and optional bounded progress. */
export function ProgressBar({ label, value }: ProgressBarProps) {
  const boundedValue = value === undefined ? undefined : Math.min(100, Math.max(0, value));
  return <progress aria-label={label} className="progress-bar" max={100} value={boundedValue} />;
}

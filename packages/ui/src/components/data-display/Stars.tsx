import { Icon } from "../icon/Icon";
import { Button } from "../button/Button";
import "./Stars.css";
export type StarsProps = { value: number; maximum?: number; label: string; disabled?: boolean } & (
  | { onChange: (value: number) => void; getOptionLabel: (value: number) => string }
  | { onChange?: undefined; getOptionLabel?: undefined }
);
/** Shows a rating or an interactive keyboard-operable rating input. @param props Value, accessible labels, and optional change handler. */
export function Stars({
  value,
  maximum = 5,
  label,
  getOptionLabel,
  onChange,
  disabled,
}: StarsProps) {
  const count = Math.max(1, Math.trunc(maximum));
  if (!onChange)
    return (
      <span aria-label={label} className="inline-flex items-center gap-0.5" role="img">
        {Array.from({ length: count }, (_, index) => {
          const fraction = Math.min(1, Math.max(0, value - index));
          const quarter = Math.round(fraction * 4);
          return (
            <span
              aria-hidden="true"
              className={`relative inline-flex star-rating-${quarter}`}
              key={index}
            >
              <Icon name="star" color="muted" />
              <span className="absolute inset-0 overflow-hidden">
                <Icon name="starFilled" color="warning" />
              </span>
            </span>
          );
        })}
      </span>
    );
  return (
    <div aria-label={label} className="inline-flex gap-1" role="group">
      {Array.from({ length: count }, (_, index) => {
        const rating = index + 1;
        return (
          <Button
            aria-label={getOptionLabel(rating)}
            disabled={disabled}
            iconOnly
            iconStart={rating <= value ? "starFilled" : "star"}
            key={rating}
            onClick={() => onChange(rating)}
            size="sm"
            variant="ghost"
          />
        );
      })}
    </div>
  );
}

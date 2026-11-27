export interface SeekBarProps {
  label: string;
  currentTime: number;
  duration: number;
  onSeek: (positionSeconds: number) => void;
  disabled?: boolean;
}

/** Renders an accessible horizontal media seek control.
 * @param props Current media position and seek event; unknown duration disables seeking.
 */
export function SeekBar({ label, currentTime, duration, onSeek, disabled = false }: SeekBarProps) {
  return (
    <input
      aria-label={label}
      className="w-full accent-primary"
      disabled={disabled || !Number.isFinite(duration) || duration <= 0}
      max={Number.isFinite(duration) ? duration : 0}
      min={0}
      onChange={(event) => onSeek(Number(event.currentTarget.value))}
      type="range"
      value={Math.min(Math.max(currentTime, 0), duration || 0)}
    />
  );
}

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export interface OtpInputProps {
  value: string;
  groupLabel: string;
  digitLabels: readonly string[];
  onChange: (value: string) => void;
  normalizeDigits: (value: string) => string;
  disabled?: boolean;
  error?: boolean;
}

/** Renders six left-to-right code fields with paste distribution and keyboard navigation. @param props Accessible labels, value, and normalized change event. */
export function OtpInput({
  value,
  groupLabel,
  digitLabels,
  onChange,
  normalizeDigits,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.slice(0, 6).split("");

  const setDigit = (index: number, rawValue: string) => {
    const next = normalizeDigits(rawValue).replace(/\D/g, "").slice(-1);
    const nextDigits = Array.from({ length: 6 }, (_, digitIndex) => digits[digitIndex] ?? "");
    nextDigits[index] = next;
    onChange(nextDigits.join(""));
    if (next && index < 5) refs.current[index + 1]?.focus();
  };

  const distributePaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    const pasted = normalizeDigits(event.clipboardData.getData("text")).replace(/\D/g, "");
    if (!pasted) return;
    const nextDigits = Array.from({ length: 6 }, (_, digitIndex) => digits[digitIndex] ?? "");
    pasted
      .slice(0, 6 - index)
      .split("")
      .forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    onChange(nextDigits.join(""));
    refs.current[Math.min(index + pasted.length, 5)]?.focus();
  };

  const moveOnBackspace = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "Backspace" || digits[index] || index === 0) return;
    refs.current[index - 1]?.focus();
  };

  return (
    <div aria-label={groupLabel} className="flex gap-2" dir="ltr" role="group">
      {Array.from({ length: 6 }, (_, index) => (
        <input
          aria-invalid={error}
          aria-label={digitLabels[index]}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className="min-h-12 w-12 rounded-md border border-border-strong bg-surface text-center text-lg text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          disabled={disabled}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => setDigit(index, event.currentTarget.value)}
          onKeyDown={(event) => moveOnBackspace(event, index)}
          onPaste={(event) => distributePaste(event, index)}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          value={digits[index] ?? ""}
        />
      ))}
    </div>
  );
}

import { useState } from "react";

/** Copies a transient value without storing payment information in app state.
 * @returns Copy action and temporary accessible confirmation state.
 */
export function useCopyValue() {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => setCopiedValue(null), 1800);
  };
  return { copiedValue, copy };
}

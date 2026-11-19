import { useCallback, useState } from "react";
/** Manages password visibility toggle state for the password field.
 * @returns Visibility state and its stable toggle event handler.
 */
export function usePasswordVisibility() {
  const [visible, setVisible] = useState(false);
  const toggleVisibility = useCallback(() => setVisible((current) => !current), []);
  return { visible, toggleVisibility };
}

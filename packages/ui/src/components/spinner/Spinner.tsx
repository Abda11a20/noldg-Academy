/** Renders a small decorative loading indicator. */
export function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
    />
  );
}

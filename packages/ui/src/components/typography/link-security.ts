const UNSAFE_PROTOCOLS = ["javascript:", "data:", "vbscript:"] as const;

/** Rejects executable or scriptable URL protocols before rendering a link destination.
 * @param to Target route or URL string.
 * @throws Error when the destination uses a forbidden protocol.
 */
export function assertSafeLinkTarget(to: string): void {
  const normalized = to.trim().toLowerCase();
  if (UNSAFE_PROTOCOLS.some((protocol) => normalized.startsWith(protocol))) {
    throw new Error("Unsafe link protocol is not allowed.");
  }
}

/** Ensures external blank-target links always include noopener and noreferrer protections.
 * @param target Optional anchor target attribute.
 * @param rel Optional caller-provided rel attribute.
 */
export function resolveSafeLinkRel(target?: string, rel?: string): string | undefined {
  if (target !== "_blank") return rel;
  const tokens = new Set((rel ?? "").split(/\s+/).filter(Boolean));
  tokens.add("noopener");
  tokens.add("noreferrer");
  return [...tokens].join(" ");
}

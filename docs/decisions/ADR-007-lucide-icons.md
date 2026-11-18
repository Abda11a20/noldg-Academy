# ADR-007: Lucide icons

## Decision

Use the maintained `lucide-react` package (pinned through the workspace catalog) for registry icons. Import it only in `packages/ui/src/icons/`; the registry keeps the public named-icon API and the single RTL direction helper. Remove the hand-written SVG path definitions. The chosen version is the highest release old enough to satisfy the seven-day release-age policy and supported by the React 19 peer range.

## Rationale

The registry remains the only icon boundary while Lucide supplies a maintained, tree-shakeable set of typed React icons.

## Status

Accepted for F1A.

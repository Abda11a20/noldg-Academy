# ADR-008: Radix for complex interactive widgets

## Decision

Use Radix primitives only for complex interactive widgets that need managed focus, keyboard behavior, or popover/listbox mechanics. In F1A this applies to Select, Checkbox, RadioGroup, and Switch. Keep simple presentational controls native and wrap primitives inside `packages/ui`.

## Rationale

Radix provides accessible, typed controlled and uncontrolled behavior while leaving visual styling to the shared design system.

## Status

Accepted for F1A.

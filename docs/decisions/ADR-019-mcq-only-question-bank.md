# ADR-019: MCQ-only question bank and legacy essays

## Status

Accepted for F8A.

## Decision

The teacher question editor creates only single-answer multiple-choice questions with two to five distinct options and one valid correct option. Legacy essay, true/false, and multiple-answer questions are displayed read-only as unsupported and cannot be selected into target assessments.

## Context

The current backend still stores essay and true/false types, allows multiple correct indexes, and supports manual essay grading. It has no archive endpoint or image/metadata fields.

## Consequences

- Target schemas reject unsupported question types and invalid option/correct-index combinations.
- Live capability flags keep unsupported metadata and archive actions unavailable.
- The adapter never turns an essay or multi-answer question into a target MCQ.
- Existing attempt snapshots remain server-owned and independent of later bank edits.
- Revisit legacy compatibility when backend target routes are available.

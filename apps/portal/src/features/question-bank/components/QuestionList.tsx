import { useMemo } from "react";
import { Badge, Button, DataTable, EmptyState, Skeleton, type DataColumn } from "@noldg/ui";
import type { Question, QuestionEntry } from "@noldg/api/contracts/assessments";
import type { QuestionBankLabels } from "../types";

function isSupportedQuestion(entry: QuestionEntry): entry is Question {
  return !("supported" in entry);
}

export interface QuestionListProps {
  entries: readonly QuestionEntry[];
  loading: boolean;
  archiveEnabled: boolean;
  labels: QuestionBankLabels;
  onEdit: (question: Question) => void;
  onPreview: (question: Question) => void;
  onArchive: (question: Question, action: "archive" | "restore") => void;
}

/** Renders responsive question rows and keeps unsupported legacy types read-only.
 * @param props Data state, localized copy, and action callbacks.
 */
export function QuestionList({
  entries,
  loading,
  archiveEnabled,
  labels,
  onEdit,
  onPreview,
  onArchive,
}: QuestionListProps) {
  const columns = useMemo<readonly DataColumn<QuestionEntry>[]>(
    () => [
      { id: "text", header: labels.questionText, render: (entry) => entry.text },
      {
        id: "subject",
        header: labels.subjectId,
        render: (entry) =>
          isSupportedQuestion(entry)
            ? (entry.subjectId ?? labels.subjectUnavailable)
            : labels.unsupportedType,
      },
      {
        id: "difficulty",
        header: labels.difficultyLabel,
        render: (entry) =>
          isSupportedQuestion(entry) && entry.difficulty
            ? labels[entry.difficulty]
            : labels.unsupportedType,
      },
      {
        id: "options",
        header: labels.optionCountLabel,
        render: (entry) =>
          isSupportedQuestion(entry)
            ? labels.questionCount.replace("{{count}}", String(entry.options.length))
            : labels.unsupportedType,
      },
      {
        id: "status",
        header: labels.statusLabel,
        render: (entry) =>
          isSupportedQuestion(entry) ? (
            <Badge tone={entry.status === "active" ? "success" : "neutral"}>
              {labels[entry.status]}
            </Badge>
          ) : (
            <Badge>{labels.unsupportedType}</Badge>
          ),
      },
    ],
    [labels],
  );
  return (
    <DataTable
      label={labels.listLabel}
      columns={columns}
      rows={entries}
      getRowKey={(entry) => entry.id}
      actionColumnLabel={labels.actionsLabel}
      loading={loading}
      loadingContent={<Skeleton className="h-48" />}
      emptyContent={
        <EmptyState icon="book" title={labels.emptyTitle} description={labels.emptyDescription} />
      }
      rowActions={(entry) =>
        isSupportedQuestion(entry) ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onPreview(entry)}>
              {labels.previewQuestion}
            </Button>
            <Button size="sm" variant="ghost" iconStart="edit" onClick={() => onEdit(entry)}>
              {labels.editQuestion}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!archiveEnabled}
              iconStart={entry.status === "active" ? "trash" : "check"}
              onClick={() => onArchive(entry, entry.status === "active" ? "archive" : "restore")}
            >
              {labels[entry.status === "active" ? "archiveQuestion" : "restoreQuestion"]}
            </Button>
          </div>
        ) : (
          <span className="text-sm text-foreground-muted">
            {labels.unsupportedLegacy.replace("{{type}}", entry.legacyType)}
          </span>
        )
      }
    />
  );
}

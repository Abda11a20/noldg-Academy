import type { AcademicSubject } from "@noldg/api/contracts/admin";
import { AppError } from "@noldg/api/errors";
import { Button, Chip, ErrorState, Select, Skeleton, type SelectOption } from "@noldg/ui";

interface TrackSubjectsBodyProps {
  isLoading: boolean;
  error: unknown;
  trackId: string;
  trackOptions: readonly SelectOption[];
  subjectId: string;
  subjectOptions: readonly SelectOption[];
  isMappingLoading: boolean;
  mappings: readonly AcademicSubject[];
  addPending: boolean;
  labels: {
    track: string;
    subject: string;
    addSubject: string;
    removeSubject: string;
    forbiddenTitle: string;
    forbiddenBody: string;
    unavailableTitle: string;
    unavailableBody: string;
  };
  onSelectTrack: (value: string) => void;
  onSelectSubject: (value: string) => void;
  addSubject: () => void;
  onRemove: (id: string) => void;
}

/** Displays mapping controls and loading, permission, and data states.
 * @param props Query status, selections, options, labels, and change handlers.
 */
export function TrackSubjectsBody({
  isLoading,
  error,
  trackId,
  trackOptions,
  subjectId,
  subjectOptions,
  isMappingLoading,
  mappings,
  addPending,
  labels,
  onSelectTrack,
  onSelectSubject,
  addSubject,
  onRemove,
}: TrackSubjectsBodyProps) {
  if (isLoading) return <Skeleton className="h-32" />;
  if (error) {
    const forbidden = error instanceof AppError && error.status === 403;
    return (
      <ErrorState
        title={forbidden ? labels.forbiddenTitle : labels.unavailableTitle}
        description={forbidden ? labels.forbiddenBody : labels.unavailableBody}
      />
    );
  }
  return (
    <div className="space-y-4">
      <Select
        id="mapping-track"
        label={labels.track}
        options={trackOptions}
        placeholder={labels.track}
        value={trackId}
        onValueChange={onSelectTrack}
      />
      {trackId ? (
        <div className="flex flex-wrap items-end gap-3">
          <Select
            id="mapping-subject"
            label={labels.subject}
            options={subjectOptions}
            placeholder={labels.subject}
            value={subjectId}
            onValueChange={onSelectSubject}
          />
          <Button disabled={!subjectId || addPending} loading={addPending} onClick={addSubject}>
            {labels.addSubject}
          </Button>
        </div>
      ) : null}
      {isMappingLoading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {mappings.map((subject) => (
            <Chip
              key={subject.id}
              removeLabel={labels.removeSubject}
              onRemove={() => onRemove(subject.id)}
            >
              {subject.name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

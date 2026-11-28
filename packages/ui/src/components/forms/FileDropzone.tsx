import { useRef, type DragEvent } from "react";
import { useFileDragState } from "../../hooks/useFileDragState";
import { Icon } from "../icon/Icon";
export interface SelectedFile {
  name: string;
  size: string;
  progress?: number;
  error?: string;
}
export interface FileDropzoneProps {
  label: string;
  description: string;
  accept?: string;
  maximumSize: string;
  files: readonly SelectedFile[];
  onFilesSelected?: (files: FileList) => void;
  disabled?: boolean;
  multiple?: boolean | undefined;
}
/** Presents a file picker and drop target; selection is emitted and never uploaded. @param props Copy, constraints, and supplied file states. */
export function FileDropzone({
  label,
  description,
  accept,
  maximumSize,
  files,
  onFilesSelected,
  disabled,
  multiple = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { dragging, startDragging, stopDragging } = useFileDragState();
  const emitFiles = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    stopDragging();
    if (!disabled && event.dataTransfer.files.length) onFilesSelected?.(event.dataTransfer.files);
  };
  return (
    <div>
      <input
        accept={accept}
        aria-label={label}
        className="sr-only"
        disabled={disabled}
        multiple={multiple}
        onChange={(event) => {
          if (event.currentTarget.files) onFilesSelected?.(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <div
        aria-label={label}
        className={`rounded-lg border-2 border-dashed p-6 text-center ${dragging ? "border-primary bg-primary-soft" : "border-border"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          startDragging();
        }}
        onDragLeave={stopDragging}
        onDragOver={(event) => event.preventDefault()}
        onDrop={emitFiles}
        role="group"
      >
        <Icon name="upload" color="muted" />
        <p className="mt-2 font-medium text-foreground">{label}</p>
        <p className="text-sm text-foreground-muted">{description}</p>
        <p className="text-sm text-foreground-subtle">{maximumSize}</p>
        <button
          className="mt-3 rounded-md border border-border-strong px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {label}
        </button>
      </div>
      {files.length ? (
        <ul className="mt-3 flex flex-col gap-2">
          {files.map((file) => (
            <li
              className="flex items-center justify-between rounded-md border border-border p-3"
              key={`${file.name}-${file.size}`}
            >
              <span className="text-foreground">
                {file.name} <span className="text-foreground-muted">{file.size}</span>
              </span>
              {typeof file.progress === "number" ? (
                <progress aria-label={file.name} max={100} value={file.progress} />
              ) : null}
              {file.error ? <span className="text-danger">{file.error}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

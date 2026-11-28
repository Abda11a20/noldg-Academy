import { useTranslation } from "react-i18next";
import { Alert, FileDropzone, FileRow } from "@noldg/ui";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import type { AttachmentUpload } from "../hooks/useAttachmentUploads";

interface LessonAttachmentsSectionProps {
  lesson?: CatalogLesson | undefined;
  files: AttachmentUpload[];
  rejectedCount: number;
  acceptedTypes: string;
  maximumSize: string;
  onSelect: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

/** Renders saved and pending lesson attachments with remove and retry events. @param props Attachment state and callbacks. */
export function LessonAttachmentsSection(props: LessonAttachmentsSectionProps) {
  const { t } = useTranslation("catalog");
  return (
    <section className="space-y-3">
      <FileDropzone
        accept={props.acceptedTypes}
        description={t("attachmentUploadDescription")}
        files={[]}
        label={t("lessonAttachments")}
        maximumSize={props.maximumSize}
        multiple
        onFilesSelected={props.onSelect}
      />
      {(props.lesson?.attachments ?? []).map((attachment) => (
        <FileRow
          key={attachment.publicId}
          name={attachment.name}
          progressLabel={t("uploadProgress")}
          sizeLabel={attachment.format.toUpperCase()}
          statusLabel={t("attachmentUploaded")}
        />
      ))}
      {props.rejectedCount > 0 ? (
        <Alert tone="danger">{t("attachmentRejected", { count: props.rejectedCount })}</Alert>
      ) : null}
      {props.files.map((item) => (
        <FileRow
          key={item.id}
          name={item.file.name}
          {...(item.progress === undefined ? {} : { progress: item.progress })}
          progressLabel={t("uploadProgress")}
          removeLabel={t("removeFile")}
          {...(item.failed
            ? { retryLabel: t("retryUpload"), onRetry: () => props.onRetry(item.id) }
            : {})}
          sizeLabel={t("fileSizeUnavailable")}
          statusLabel={t(
            item.failed
              ? "uploadFailed"
              : item.uploadToken
                ? "attachmentUploaded"
                : "uploadingAttachment",
          )}
          onRemove={() => props.onRemove(item.id)}
        />
      ))}
    </section>
  );
}

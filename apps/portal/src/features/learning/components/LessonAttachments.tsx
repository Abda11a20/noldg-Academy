import { useTranslation } from "react-i18next";
import { Button, EmptyState, Heading, Text } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import { capabilities } from "@noldg/api/config/capabilities";
import type { useAttachmentDownload } from "../hooks/useAttachmentDownload";

type AttachmentDownload = ReturnType<typeof useAttachmentDownload>;

/** Renders attachment actions and the current backend capability state.
 * @param props Lesson files and the short-lived-link request mutation.
 */
export function LessonAttachments({
  lesson,
  download,
}: {
  lesson: StudentLesson;
  download: AttachmentDownload;
}) {
  const { t } = useTranslation("learning");
  return (
    <section className="flex flex-col gap-2">
      <Heading level={2}>{t("lesson.attachments")}</Heading>
      {lesson.attachments.length > 0 ? (
        lesson.attachments.map((attachment) => (
          <Button
            key={attachment.id}
            disabled={download.isPending || !capabilities.attachmentDownload}
            onClick={() => download.mutate(attachment.id)}
            variant="secondary"
          >
            {attachment.name}
          </Button>
        ))
      ) : (
        <EmptyState
          icon="file"
          title={t("lesson.noAttachments")}
          description={t("lesson.noAttachmentsDescription")}
        />
      )}
      {download.isError ? <Text role="alert">{t("lesson.attachmentDownloadError")}</Text> : null}
      {!capabilities.attachmentDownload ? (
        <Text size="sm" tone="muted">
          {t("lesson.attachmentsUnavailable")}
        </Text>
      ) : null}
    </section>
  );
}

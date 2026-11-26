import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";
import { Alert, Breadcrumbs, Heading } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import { ROUTE_PATHS, getTeacherCoursePath } from "../../../shared/navigation/routes";
import { DEFAULT_UPLOAD_LIMITS } from "../constants";
import type { AttachmentUpload } from "../hooks/useAttachmentUploads";
import type { VideoUploadState } from "../hooks/useVideoUpload";
import type { LessonFormValues } from "../schemas/lesson-form";
import { ATTACHMENT_ACCEPT, VIDEO_ACCEPTED_TYPES } from "../upload-constants";
import { LessonBasicsSection } from "./LessonBasicsSection";
import { LessonScheduleSection } from "./LessonScheduleSection";
import { LessonAccessSection } from "./LessonAccessSection";
import { LessonVideoSection } from "./LessonVideoSection";
import { LessonAttachmentsSection } from "./LessonAttachmentsSection";
import { LessonStatusSection } from "./LessonStatusSection";
import { LessonEditorDialogs } from "./LessonEditorDialogs";

export interface LessonEditorContentProps {
  courseId: string;
  lesson: CatalogLesson | undefined;
  form: UseFormReturn<LessonFormValues>;
  access: LessonFormValues["access"];
  scheduleLocked: boolean;
  isReady: boolean;
  busy: boolean;
  uploadState: VideoUploadState;
  videoFile: File | undefined;
  replacementPending: boolean;
  showReplace: boolean;
  attachmentFiles: AttachmentUpload[];
  rejectedAttachmentCount: number;
  blockerState: "blocked" | "unblocked" | "proceeding";
  validationMessage: (value: unknown) => string | undefined;
  maximumVideoSize: string;
  maximumAttachmentSize: string;
  onPickVideo: (files: FileList) => void;
  onRemoveVideo: () => void;
  onCancelUpload: () => void;
  onRetryUpload: () => void;
  onStartUpload: () => void;
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  onRetryAttachment: (id: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onConfirmLeave: () => void;
  onCancelLeave: (open: boolean) => void;
  onConfirmReplace: () => void;
  onCancelReplace: (open: boolean) => void;
}

/** Renders the composed lesson editor sections from state and callbacks. @param props Editor state and user events. */
export function LessonEditorContent(props: LessonEditorContentProps) {
  const { t } = useTranslation(["catalog"]);
  const { form } = props;
  const largeFileWarning = Boolean(
    props.videoFile && props.videoFile.size >= DEFAULT_UPLOAD_LIMITS.largeVideoWarningBytes,
  );
  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: t("catalog:coursesTitle"), to: ROUTE_PATHS.teacher },
          { label: t("catalog:lessonsTitle"), to: getTeacherCoursePath(props.courseId) },
          { label: props.lesson ? props.lesson.title : t("catalog:createLesson") },
        ]}
        label={t("catalog:courseBreadcrumb")}
      />
      <Heading level={1}>
        {props.lesson ? t("catalog:editLesson") : t("catalog:createLesson")}
      </Heading>
      {!capabilities.lessonWindowRules ? (
        <Alert tone="info">{t("catalog:windowRulesUnavailable")}</Alert>
      ) : null}
      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
        <LessonBasicsSection
          descriptionError={props.validationMessage(form.formState.errors.description)}
          descriptionField={form.register("description")}
          titleError={props.validationMessage(form.formState.errors.title)}
          titleField={form.register("title")}
        />
        <LessonScheduleSection
          control={form.control}
          disabled={props.scheduleLocked}
          endError={form.formState.errors.availableUntilLocal}
          lesson={props.lesson}
          startError={form.formState.errors.availableFromLocal}
          validationMessage={props.validationMessage}
        />
        <LessonAccessSection
          access={props.access}
          control={form.control}
          lesson={props.lesson}
          priceError={props.validationMessage(form.formState.errors.price)}
        />
        <LessonVideoSection
          acceptedTypes={VIDEO_ACCEPTED_TYPES.join(",")}
          largeFileWarning={largeFileWarning}
          lesson={props.lesson}
          maximumSize={props.maximumVideoSize}
          onCancel={props.onCancelUpload}
          onRemove={props.onRemoveVideo}
          onRetry={props.onRetryUpload}
          onSelect={props.onPickVideo}
          onStart={props.onStartUpload}
          replacementPending={props.replacementPending}
          uploadState={props.uploadState}
          videoFile={props.videoFile}
        />
        <LessonAttachmentsSection
          acceptedTypes={ATTACHMENT_ACCEPT}
          files={props.attachmentFiles}
          lesson={props.lesson}
          maximumSize={props.maximumAttachmentSize}
          onRemove={props.onRemoveAttachment}
          onRetry={props.onRetryAttachment}
          onSelect={props.onAddAttachments}
          rejectedCount={props.rejectedAttachmentCount}
        />
        <LessonStatusSection
          busy={props.busy}
          canSaveDraft={Boolean(capabilities.lessonDrafts || props.lesson)}
          isReady={props.isReady}
          onPublish={props.onPublish}
          onSaveDraft={props.onSaveDraft}
        />
      </form>
      <LessonEditorDialogs
        leaveBlocked={props.blockerState === "blocked"}
        onCancelLeave={props.onCancelLeave}
        onCancelReplace={props.onCancelReplace}
        onConfirmLeave={props.onConfirmLeave}
        onConfirmReplace={props.onConfirmReplace}
        showReplace={props.showReplace}
      />
    </section>
  );
}

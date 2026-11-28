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

interface LessonEditorVideoProps {
  file: File | undefined;
  uploadState: VideoUploadState;
  replacementPending: boolean;
  maximumSize: string;
  onPick: (files: FileList) => void;
  onRemove: () => void;
  onStart: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

interface LessonEditorAttachmentsProps {
  files: AttachmentUpload[];
  rejectedCount: number;
  maximumSize: string;
  onAdd: (files: FileList) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

interface LessonEditorDialogsProps {
  leaveBlocked: boolean;
  showReplace: boolean;
  onConfirmLeave: () => void;
  onCancelLeave: (open: boolean) => void;
  onConfirmReplace: () => void;
  onCancelReplace: (open: boolean) => void;
}

export interface LessonEditorContentProps {
  courseId: string;
  lesson: CatalogLesson | undefined;
  form: UseFormReturn<LessonFormValues>;
  access: LessonFormValues["access"];
  scheduleLocked: boolean;
  isReady: boolean;
  busy: boolean;
  validationMessage: (value: unknown) => string | undefined;
  video: LessonEditorVideoProps;
  attachments: LessonEditorAttachmentsProps;
  dialogs: LessonEditorDialogsProps;
  onSaveDraft: () => void;
  onPublish: () => void;
}

/** Renders the composed lesson editor sections from state and callbacks. @param props Editor state and user events. */
export function LessonEditorContent(props: LessonEditorContentProps) {
  const { t } = useTranslation(["catalog"]);
  const { form, video, attachments, dialogs } = props;
  const largeFileWarning = Boolean(
    video.file && video.file.size >= DEFAULT_UPLOAD_LIMITS.largeVideoWarningBytes,
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
          maximumSize={video.maximumSize}
          onCancel={video.onCancel}
          onRemove={video.onRemove}
          onRetry={video.onRetry}
          onSelect={video.onPick}
          onStart={video.onStart}
          replacementPending={video.replacementPending}
          uploadState={video.uploadState}
          videoFile={video.file}
        />
        <LessonAttachmentsSection
          acceptedTypes={ATTACHMENT_ACCEPT}
          files={attachments.files}
          lesson={props.lesson}
          maximumSize={attachments.maximumSize}
          onRemove={attachments.onRemove}
          onRetry={attachments.onRetry}
          onSelect={attachments.onAdd}
          rejectedCount={attachments.rejectedCount}
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
        leaveBlocked={dialogs.leaveBlocked}
        onCancelLeave={dialogs.onCancelLeave}
        onCancelReplace={dialogs.onCancelReplace}
        onConfirmLeave={dialogs.onConfirmLeave}
        onConfirmReplace={dialogs.onConfirmReplace}
        showReplace={dialogs.showReplace}
      />
    </section>
  );
}

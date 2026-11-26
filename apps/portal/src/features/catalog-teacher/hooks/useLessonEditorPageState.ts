import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBlocker, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { capabilities } from "@noldg/api/config/capabilities";
import { getCourseLesson } from "@noldg/api/endpoints/catalog";
import { useTranslation } from "react-i18next";
import { useVideoUpload } from "./useVideoUpload";
import { useAttachmentUploads } from "./useAttachmentUploads";
import { useCatalogMutations } from "./useCatalogMutations";
import { useLessonEditorSave } from "./useLessonEditorSave";
import { useLessonEditorVideoSelection } from "./useLessonEditorVideoSelection";
import { catalogQueryKeys } from "../catalog-query-keys";
import { DEFAULT_UPLOAD_LIMITS } from "../constants";
import { isoToCairoLocal } from "../../../shared/time/time";
import { getTeacherLessonPath } from "../../../shared/navigation/routes";
import {
  createLessonFormSchema,
  LESSON_FORM_DEFAULTS,
  type LessonFormValues,
} from "../schemas/lesson-form";
import { lessonValidationMessage } from "../schemas/lesson-validation-message";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { formatFileSize } from "../../../shared/i18n/formatting";
import type { LessonEditorContentProps } from "../components/LessonEditorContent";
import type { TFunction } from "i18next";
import type { UseFormReturn } from "react-hook-form";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";

function shouldBlockRouteChange(
  isDirty: boolean,
  hasVideo: boolean,
  attachmentCount: number,
  currentPath: string,
  nextPath: string,
): boolean {
  return (isDirty || hasVideo || attachmentCount > 0) && currentPath !== nextPath;
}

function isEditorBusy(
  isSubmitting: boolean,
  uploadStatus: string,
  hasVideo: boolean,
  attachmentsPending: boolean,
  attachmentsFailed: boolean,
  savingLesson: boolean,
  changingStatus: boolean,
): boolean {
  const uploadPending = ["requesting-ticket", "uploading", "attaching", "processing"].includes(
    uploadStatus,
  );
  const videoSelectionPending = hasVideo && ["idle", "failed"].includes(uploadStatus);
  return (
    isSubmitting ||
    uploadPending ||
    videoSelectionPending ||
    attachmentsPending ||
    attachmentsFailed ||
    savingLesson ||
    changingStatus
  );
}

function getPageErrorMessage(isForbidden: boolean, t: TFunction<["catalog", "errors"]>): string {
  return isForbidden ? t("errors:forbidden") : t("catalog:lessonNotFound");
}

function getNonReadyState(
  hasCourse: boolean,
  hasError: boolean,
  isLoading: boolean,
  hasLessonId: boolean,
  message: string,
): LessonEditorPageState | undefined {
  if (!hasCourse) return { screen: "missing-course", message };
  if (hasError) return { screen: "not-found", message };
  if (hasLessonId && isLoading) return { screen: "loading", message };
  return undefined;
}

function getNonReadyMessage(
  hasCourse: boolean,
  isLoading: boolean,
  errorMessage: string,
  t: TFunction<["catalog", "errors"]>,
): string {
  if (!hasCourse) return t("catalog:courseNotFound");
  if (isLoading) return t("catalog:loadingLesson");
  return errorMessage;
}

function isVideoReady(lesson: CatalogLesson | undefined, uploadStatus: string): boolean {
  return lesson?.videoState === "ready" || uploadStatus === "ready";
}

function confirmLeave(blocker: ReturnType<typeof useBlocker>): void {
  if (blocker.state === "blocked") blocker.proceed();
}

function cancelLeave(blocker: ReturnType<typeof useBlocker>, open: boolean): void {
  if (!open && blocker.state === "blocked") blocker.reset();
}

function startVideoUpload(
  upload: ReturnType<typeof useVideoUpload>,
  file: File | undefined,
  courseId: string,
): void {
  if (file) void upload.upload(courseId, file);
}

function useLessonFormReset(
  form: UseFormReturn<LessonFormValues>,
  lesson: CatalogLesson | undefined,
): void {
  useEffect(() => {
    if (!lesson) return;
    form.reset({
      title: lesson.title,
      description: lesson.description,
      availableFromLocal: isoToCairoLocal(lesson.availableFrom),
      availableUntilLocal: isoToCairoLocal(lesson.availableUntil),
      access: lesson.access,
      price: lesson.price === undefined ? "" : String(lesson.price),
    });
  }, [form, lesson]);
}

export type LessonEditorPageState =
  | { screen: "missing-course" | "loading" | "not-found"; message: string }
  | { screen: "ready"; editor: LessonEditorContentProps };

/** Loads lesson editor data and coordinates editor hooks without rendering UI. */
export function useLessonEditorPageState(): LessonEditorPageState {
  const { t } = useTranslation(["catalog", "errors"]);
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const allowPostSaveNavigation = useRef(false);
  const schema = useMemo(() => createLessonFormSchema(() => new Date()), []);
  const form = useForm<LessonFormValues>({
    resolver: zodResolver(schema),
    defaultValues: LESSON_FORM_DEFAULTS,
  });
  const access = useWatch({ control: form.control, name: "access" });
  const upload = useVideoUpload();
  const attachments = useAttachmentUploads(courseId ?? "");
  const mutations = useCatalogMutations(courseId ?? "");
  const lessonQuery = useQuery({
    queryKey: [...catalogQueryKeys.lessons(courseId ?? "none"), lessonId ?? "new"],
    queryFn: ({ signal }) => getCourseLesson(courseId ?? "", lessonId ?? "", signal, true),
    enabled: Boolean(courseId) && Boolean(lessonId),
  });
  const lesson = lessonQuery.data;
  const video = useLessonEditorVideoSelection(courseId ?? "", lesson, upload);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (allowPostSaveNavigation.current) {
      allowPostSaveNavigation.current = false;
      return false;
    }
    return shouldBlockRouteChange(
      form.formState.isDirty,
      Boolean(video.videoFile),
      attachments.files.length,
      currentLocation.pathname,
      nextLocation.pathname,
    );
  });
  useLessonFormReset(form, lesson);
  const save = useLessonEditorSave({
    attachmentUploadTokens: attachments.uploadTokens,
    attachAndPoll: upload.attachAndPoll,
    changeStatus: async (id, status) =>
      mutations.changeLessonStatusMutation.mutateAsync({ lessonId: id, status }),
    clearAttachments: attachments.clear,
    clearVideo: () => video.setVideoFile(undefined),
    form,
    lessonId,
    navigateToLesson: (id) => {
      allowPostSaveNavigation.current = true;
      void navigate(getTeacherLessonPath(courseId ?? "", id), { replace: true });
    },
    saveLesson: mutations.saveLesson,
    uploadState: upload.state,
  });
  const errorMessage = getPageErrorMessage(isForbiddenError(lessonQuery.error), t);
  const nonReadyState = getNonReadyState(
    Boolean(courseId),
    lessonQuery.isError,
    lessonQuery.isPending,
    Boolean(lessonId),
    getNonReadyMessage(Boolean(courseId), lessonQuery.isPending, errorMessage, t),
  );
  if (nonReadyState) return nonReadyState;
  const busy = isEditorBusy(
    form.formState.isSubmitting,
    upload.state.status,
    Boolean(video.videoFile),
    attachments.isPending,
    attachments.hasFailures,
    mutations.isSavingLesson,
    mutations.changeLessonStatusMutation.isPending,
  );
  const isReady = isVideoReady(lesson, upload.state.status);
  const editor: LessonEditorContentProps = {
    access,
    attachmentFiles: attachments.files,
    blockerState: blocker.state,
    busy,
    courseId: courseId ?? "",
    form,
    isReady,
    lesson,
    maximumAttachmentSize: t("catalog:attachmentSizeLimit", {
      size: formatFileSize(DEFAULT_UPLOAD_LIMITS.attachmentBytes),
    }),
    maximumVideoSize: t("catalog:videoSizeLimit", {
      size: formatFileSize(DEFAULT_UPLOAD_LIMITS.videoBytes),
    }),
    onAddAttachments: attachments.addFiles,
    onCancelLeave: (open) => cancelLeave(blocker, open),
    onCancelReplace: video.cancelReplace,
    onCancelUpload: upload.cancel,
    onConfirmLeave: () => confirmLeave(blocker),
    onConfirmReplace: video.confirmReplace,
    onPickVideo: video.pickVideo,
    onPublish: save.handlePublish,
    onRemoveAttachment: attachments.remove,
    onRemoveVideo: video.removeVideo,
    onRetryAttachment: attachments.retry,
    onRetryUpload: upload.retry,
    onSaveDraft: save.handleSaveDraft,
    onStartUpload: () => startVideoUpload(upload, video.videoFile, courseId ?? ""),
    rejectedAttachmentCount: attachments.rejectedCount,
    replacementPending: video.replacementPending,
    scheduleLocked: Boolean(lesson && !capabilities.lessonWindowRules),
    showReplace: video.showReplace,
    uploadState: upload.state,
    validationMessage: (value) => lessonValidationMessage(value, t),
    videoFile: video.videoFile,
  };
  return { screen: "ready", editor };
}

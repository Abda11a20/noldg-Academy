import { useTranslation } from "react-i18next";
import { Alert, Button, FileDropzone, FileRow } from "@noldg/ui";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import type { VideoUploadState } from "../hooks/useVideoUpload";
import { formatFileSize } from "../../../shared/i18n/formatting";
import type { TFunction } from "i18next";

interface LessonVideoSectionProps {
  lesson?: CatalogLesson | undefined;
  videoFile?: File | undefined;
  uploadState: VideoUploadState;
  acceptedTypes: string;
  maximumSize: string;
  largeFileWarning: boolean;
  replacementPending: boolean;
  onSelect: (files: FileList) => void;
  onRemove: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onStart: () => void;
}

function getUploadProgress(uploadState: VideoUploadState): number | undefined {
  if (uploadState.status !== "uploading" || !uploadState.progress?.total) return undefined;
  return Math.round((uploadState.progress.loaded / uploadState.progress.total) * 100);
}

function getCurrentStatusKey(
  uploadState: VideoUploadState,
): "uploadFailed" | "videoReady" | "videoProcessing" | "fileSelected" {
  if (uploadState.status === "failed") return "uploadFailed";
  if (uploadState.status === "ready") return "videoReady";
  if (uploadState.status === "uploaded") return "videoProcessing";
  return "fileSelected";
}

const VIDEO_STATUS_KEYS = {
  none: "videoNone",
  uploading: "videoUploading",
  processing: "videoProcessing",
  ready: "videoReady",
  failed: "videoFailed",
} as const;

type CatalogTranslator = TFunction<"catalog">;

function renderExistingVideo(
  lesson: CatalogLesson | undefined,
  videoFile: File | undefined,
  t: CatalogTranslator,
) {
  if (videoFile || !lesson?.video) return null;
  return (
    <FileRow
      name={lesson.title + "." + lesson.video.format}
      progressLabel={t("uploadProgress")}
      sizeLabel={t("fileSizeUnavailable")}
      statusLabel={t(VIDEO_STATUS_KEYS[lesson.videoState])}
    />
  );
}

function renderSelectedVideo(
  videoFile: File | undefined,
  progress: number | undefined,
  status: "uploadFailed" | "videoReady" | "videoProcessing" | "fileSelected",
  onRemove: () => void,
  t: CatalogTranslator,
) {
  if (!videoFile) return null;
  return (
    <FileRow
      name={videoFile.name}
      {...(progress === undefined ? {} : { progress })}
      progressLabel={t("uploadProgress")}
      removeLabel={t("removeFile")}
      sizeLabel={formatFileSize(videoFile.size)}
      statusLabel={t(status)}
      onRemove={onRemove}
    />
  );
}

function renderUploadActions(props: LessonVideoSectionProps, t: CatalogTranslator) {
  const isUploading = props.uploadState.status === "uploading";
  const failed = props.uploadState.status === "failed";
  const canStart =
    props.uploadState.status === "idle" && Boolean(props.videoFile) && !props.replacementPending;
  return (
    <>
      {isUploading ? (
        <Button onClick={props.onCancel} variant="secondary">
          {t("cancelUpload")}
        </Button>
      ) : null}
      {failed ? (
        <Button onClick={props.onRetry} variant="secondary">
          {t("retryUpload")}
        </Button>
      ) : null}
      {canStart ? <Button onClick={props.onStart}>{t("startUpload")}</Button> : null}
    </>
  );
}

/** Renders video selection and upload status while delegating behavior through events. @param props Video state and callbacks. */
export function LessonVideoSection(props: LessonVideoSectionProps) {
  const { t } = useTranslation("catalog");
  const uploadProgress = getUploadProgress(props.uploadState);
  return (
    <section className="space-y-3">
      <FileDropzone
        accept={props.acceptedTypes}
        description={t("videoUploadDescription")}
        files={[]}
        label={t("lessonVideo")}
        maximumSize={props.maximumSize}
        onFilesSelected={props.onSelect}
      />
      {renderExistingVideo(props.lesson, props.videoFile, t)}
      {renderSelectedVideo(
        props.videoFile,
        uploadProgress,
        getCurrentStatusKey(props.uploadState),
        props.onRemove,
        t,
      )}
      {props.largeFileWarning ? <Alert tone="warning">{t("uploadLargeFileHint")}</Alert> : null}
      {renderUploadActions(props, t)}
    </section>
  );
}

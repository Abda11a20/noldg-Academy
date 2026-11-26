import { useState } from "react";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import type { VideoUploadState } from "./useVideoUpload";

interface UploadActions {
  state: VideoUploadState;
  upload: (courseId: string, file: File) => Promise<void>;
  cancel: () => void;
}

/** Owns selected video and explicit replacement confirmation state. @param courseId Course receiving the upload. @param lesson Existing lesson, if editing. @param upload Upload hook actions. */
export function useLessonEditorVideoSelection(
  courseId: string,
  lesson: CatalogLesson | undefined,
  upload: UploadActions,
) {
  const [showReplace, setShowReplace] = useState(false);
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [previousVideoFile, setPreviousVideoFile] = useState<File | undefined>();
  const [replacementPending, setReplacementPending] = useState(false);
  const pickVideo = (files: FileList) => {
    const selected = files.item(0);
    if (!selected) return;
    if (lesson?.video || videoFile) {
      setPreviousVideoFile(videoFile);
      setReplacementPending(true);
      setVideoFile(selected);
      setShowReplace(true);
      return;
    }
    setVideoFile(selected);
  };
  const confirmReplace = () => {
    if (videoFile) void upload.upload(courseId, videoFile);
    setPreviousVideoFile(undefined);
    setReplacementPending(false);
    setShowReplace(false);
  };
  const cancelReplace = (open: boolean) => {
    setShowReplace(open);
    if (!open && replacementPending) {
      setVideoFile(previousVideoFile);
      setPreviousVideoFile(undefined);
      setReplacementPending(false);
    }
  };
  const removeVideo = () => {
    upload.cancel();
    setVideoFile(undefined);
  };
  return {
    showReplace,
    videoFile,
    replacementPending,
    setVideoFile,
    pickVideo,
    confirmReplace,
    cancelReplace,
    removeVideo,
  };
}

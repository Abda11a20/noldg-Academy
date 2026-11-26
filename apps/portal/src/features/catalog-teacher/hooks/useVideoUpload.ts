import { useCallback, useEffect, useRef, useState } from "react";
import { AppError } from "@noldg/api/errors";
import { getCourseLesson, requestLessonUploadTicket } from "@noldg/api/endpoints/catalog";
import { uploadFile, type UploadProgress } from "@noldg/api/uploads";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { VIDEO_UPLOAD_POLL_DELAYS_MS } from "../upload-constants";
import { validateVideoFile } from "../validate-video-file";

export type VideoUploadState =
  | { status: "idle" }
  | { status: "requesting-ticket"; fileName: string }
  | { status: "uploading"; fileName: string; progress?: UploadProgress }
  | { status: "uploaded"; fileName: string; uploadToken: string }
  | { status: "attaching"; fileName: string }
  | { status: "processing"; fileName: string }
  | { status: "ready"; fileName: string; uploadToken: string }
  | { status: "failed"; fileName: string; reason: "type" | "size" | "upload" | "processing" };

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Upload cancelled", "AbortError"));
    };
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Manages one video upload, transient token, cancellation, and bounded processing polling. */
export function useVideoUpload() {
  const [state, setState] = useState<VideoUploadState>({ status: "idle" });
  const controller = useRef<AbortController | undefined>(undefined);
  const fileRef = useRef<File | undefined>(undefined);
  const courseRef = useRef<string | undefined>(undefined);
  const reportError = useApiErrorToast();

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = undefined;
    fileRef.current = undefined;
    courseRef.current = undefined;
    setState({ status: "idle" });
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  const upload = useCallback(
    async (courseId: string, file: File) => {
      controller.current?.abort();
      const validation = validateVideoFile(file);
      if (validation) {
        setState({ status: "failed", fileName: file.name, reason: validation });
        return;
      }
      const abortController = new AbortController();
      controller.current = abortController;
      fileRef.current = file;
      courseRef.current = courseId;
      setState({ status: "requesting-ticket", fileName: file.name });
      try {
        let ticket = await requestLessonUploadTicket(
          courseId,
          { kind: "video", name: file.name },
          abortController.signal,
        );
        setState({ status: "uploading", fileName: file.name });
        const options = {
          signal: abortController.signal,
          onProgress: (progress: UploadProgress) =>
            setState({ status: "uploading", fileName: file.name, progress }),
        };
        let result;
        try {
          result = await uploadFile(ticket, file, options);
        } catch (error) {
          if (!(error instanceof AppError) || error.code !== "UPLOAD_EXPIRED") throw error;
          ticket = await requestLessonUploadTicket(
            courseId,
            { kind: "video", name: file.name },
            abortController.signal,
          );
          result = await uploadFile(ticket, file, options);
        }
        setState({ status: "uploaded", fileName: file.name, uploadToken: result.uploadToken });
      } catch (error) {
        if (!abortController.signal.aborted) {
          reportError(error);
          setState({ status: "failed", fileName: file.name, reason: "upload" });
        }
      }
    },
    [reportError],
  );

  const attachAndPoll = useCallback(
    async <T extends { id: string }>(save: (uploadToken: string) => Promise<T | undefined>) => {
      if (state.status !== "uploaded") return undefined;
      const { fileName, uploadToken } = state;
      const courseId = courseRef.current;
      if (!courseId) return undefined;
      const abortController = new AbortController();
      controller.current?.abort();
      controller.current = abortController;
      setState({ status: "attaching", fileName });
      try {
        const savedLesson = await save(uploadToken);
        if (!savedLesson) {
          setState({ status: "failed", fileName, reason: "processing" });
          return undefined;
        }
        setState({ status: "processing", fileName });
        for (const waitMs of VIDEO_UPLOAD_POLL_DELAYS_MS) {
          await delay(waitMs, abortController.signal);
          const current = await getCourseLesson(courseId, savedLesson.id, abortController.signal);
          if (current.videoState === "ready") {
            setState({ status: "ready", fileName, uploadToken });
            return current;
          }
          if (current.videoState === "failed") {
            throw new AppError({
              code: "UPLOAD_PROCESSING_FAILED",
              status: 422,
              message_key: "errors:uploadRejected",
            });
          }
        }
        throw new AppError({
          code: "UPLOAD_PROCESSING_TIMEOUT",
          status: 408,
          message_key: "errors:requestTimeout",
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          reportError(error);
          setState({ status: "failed", fileName, reason: "processing" });
        }
        return undefined;
      }
    },
    [reportError, state],
  );

  const retry = useCallback(() => {
    const file = fileRef.current;
    const courseId = courseRef.current;
    if (file && courseId) void upload(courseId, file);
  }, [upload]);
  return { state, upload, attachAndPoll, cancel, retry };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { requestLessonUploadTicket } from "@noldg/api/endpoints/catalog";
import { uploadFile, type UploadProgress } from "@noldg/api/uploads";
import { useApiErrorToast } from "../../../shared/errors/useApiErrorToast";
import { ATTACHMENT_COUNT_LIMIT, DEFAULT_UPLOAD_LIMITS } from "../constants";
import { ATTACHMENT_ACCEPT } from "../upload-constants";

const SUPPORTED_ATTACHMENT_EXTENSIONS = new Set(ATTACHMENT_ACCEPT.split(","));
const MAX_ATTACHMENT_FILENAME_LENGTH = 255;

function isValidAttachmentFile(file: File): boolean {
  const extension = `.${file.name.split(".").at(-1)?.toLocaleLowerCase()}`;
  return (
    file.name.length > 0 &&
    file.name.length <= MAX_ATTACHMENT_FILENAME_LENGTH &&
    file.size > 0 &&
    file.size <= DEFAULT_UPLOAD_LIMITS.attachmentBytes &&
    SUPPORTED_ATTACHMENT_EXTENSIONS.has(extension)
  );
}

export interface AttachmentUpload {
  id: string;
  file: File;
  uploadToken?: string;
  progress?: number;
  failed: boolean;
  uploading?: boolean;
}

/** Uploads selected lesson attachments directly and keeps only transient file and ticket state.
 * @param courseId Owning course used to request a signed upload ticket.
 * @param existingCount Count of attachments already saved on the lesson.
 */
export function useAttachmentUploads(courseId: string, existingCount = 0) {
  const [files, setFiles] = useState<AttachmentUpload[]>([]);
  const [rejectedCount, setRejectedCount] = useState(0);
  const controllers = useRef(new Map<string, AbortController>());
  const reportError = useApiErrorToast();

  const upload = useCallback(
    async (id: string, file: File) => {
      controllers.current.get(id)?.abort();
      const controller = new AbortController();
      controllers.current.set(id, controller);
      setFiles((current) =>
        current.map((item) =>
          item.id === id ? { ...item, failed: false, uploading: true } : item,
        ),
      );
      try {
        const ticket = await requestLessonUploadTicket(
          courseId,
          { kind: "attachment", name: file.name },
          controller.signal,
        );
        const result = await uploadFile(ticket, file, {
          signal: controller.signal,
          onProgress: (progress: UploadProgress) => {
            const percent =
              progress.total === 0 ? 0 : Math.round((progress.loaded / progress.total) * 100);
            setFiles((current) =>
              current.map((item) => (item.id === id ? { ...item, progress: percent } : item)),
            );
          },
        });
        setFiles((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, uploadToken: result.uploadToken, progress: 100, uploading: false }
              : item,
          ),
        );
      } catch (error) {
        if (!controller.signal.aborted) {
          reportError(error);
          setFiles((current) =>
            current.map((item) =>
              item.id === id ? { ...item, failed: true, uploading: false } : item,
            ),
          );
        }
      } finally {
        controllers.current.delete(id);
      }
    },
    [courseId, reportError],
  );

  const addFiles = useCallback(
    (selected: FileList) => {
      let remaining = Math.max(0, ATTACHMENT_COUNT_LIMIT - existingCount - files.length);
      let rejected = 0;
      for (const file of Array.from(selected)) {
        if (!isValidAttachmentFile(file) || remaining === 0) {
          rejected += 1;
          continue;
        }
        remaining -= 1;
        const id = crypto.randomUUID();
        setFiles((current) => [...current, { id, file, failed: false }]);
        void upload(id, file);
      }
      setRejectedCount(rejected);
    },
    [existingCount, files.length, upload],
  );

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    setFiles((current) => current.filter((item) => item.id !== id));
  }, []);

  const retry = useCallback(
    (id: string) => {
      const item = files.find((file) => file.id === id);
      if (item) void upload(item.id, item.file);
    },
    [files, upload],
  );

  const clear = useCallback(() => {
    for (const controller of controllers.current.values()) controller.abort();
    controllers.current.clear();
    setFiles([]);
    setRejectedCount(0);
  }, []);

  useEffect(
    () => () => {
      for (const controller of controllers.current.values()) controller.abort();
    },
    [],
  );

  return {
    files,
    addFiles,
    remove,
    retry,
    clear,
    rejectedCount,
    isPending: files.some((file) => file.uploading),
    hasFailures: files.some((file) => file.failed),
    uploadTokens: files.flatMap((file) => (file.uploadToken ? [file.uploadToken] : [])),
  };
}

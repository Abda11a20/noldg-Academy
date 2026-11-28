import { useMutation } from "@tanstack/react-query";
import { getAttachmentDownload } from "@noldg/api/endpoints/learning";

function triggerAttachmentDownload(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") return;
  const link = document.createElement("a");
  link.href = parsed.toString();
  link.rel = "noopener noreferrer";
  link.download = "";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Requests an attachment URL only when the student activates its download action.
 * @param lessonId Lesson that owns the attachment.
 */
export function useAttachmentDownload(lessonId: string, navigateToUrl = triggerAttachmentDownload) {
  return useMutation({
    mutationFn: (attachmentId: string) => getAttachmentDownload(lessonId, attachmentId),
    onSuccess: (url) => navigateToUrl(url),
    gcTime: 0,
  });
}

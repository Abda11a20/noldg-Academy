import { useMutation } from "@tanstack/react-query";
import { getAttachmentDownload } from "@noldg/api/endpoints/learning";

/** Requests an attachment URL only when the student activates its download action.
 * @param lessonId Lesson that owns the attachment.
 */
export function useAttachmentDownload(
  lessonId: string,
  navigateToUrl = (url: string) => window.location.assign(url),
) {
  return useMutation({
    mutationFn: (attachmentId: string) => getAttachmentDownload(lessonId, attachmentId),
    onSuccess: (url) => navigateToUrl(url),
    gcTime: 0,
  });
}

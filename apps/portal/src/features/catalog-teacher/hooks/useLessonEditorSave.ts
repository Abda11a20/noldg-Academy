import { useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { CatalogLesson, LessonInput } from "@noldg/api/contracts/catalog";
import type { LessonFormValues } from "../schemas/lesson-form";
import type { VideoUploadState } from "./useVideoUpload";
import { cairoLocalToIso } from "../../../shared/time/time";

interface LessonEditorSaveArguments {
  lessonId?: string | undefined;
  form: UseFormReturn<LessonFormValues>;
  uploadState: VideoUploadState;
  attachmentUploadTokens: string[];
  saveLesson: (input: LessonInput, lessonId?: string) => Promise<CatalogLesson | undefined>;
  attachAndPoll: (
    save: (token: string) => Promise<CatalogLesson | undefined>,
  ) => Promise<CatalogLesson | undefined>;
  changeStatus: (lessonId: string, status: "draft" | "published") => Promise<unknown>;
  clearAttachments: () => void;
  clearVideo: () => void;
  navigateToLesson: (lessonId: string) => void;
}

function makeLessonInput(
  values: LessonFormValues,
  status: "draft" | "published",
  attachmentTokens: string[],
): LessonInput {
  return {
    title: values.title,
    description: values.description,
    kind: "recorded",
    status,
    availableFrom: cairoLocalToIso(values.availableFromLocal),
    availableUntil: cairoLocalToIso(values.availableUntilLocal),
    access: values.access,
    ...(values.access === "paid" ? { price: Number(values.price) } : {}),
    ...(attachmentTokens.length ? { attachmentUploadTokens: attachmentTokens } : {}),
  };
}

/** Coordinates form submission with existing upload and mutation hooks. @param args Editor state and injected async actions. */
export function useLessonEditorSave(args: LessonEditorSaveArguments) {
  const submit = useCallback(
    async (values: LessonFormValues, status: "draft" | "published") => {
      const input = makeLessonInput(values, status, args.attachmentUploadTokens);
      const persist = (token?: string) =>
        args.saveLesson(
          {
            ...input,
            ...(token ? { videoUploadToken: token } : {}),
          },
          args.lessonId,
        );
      const attachedVideo = args.uploadState.status === "uploaded";
      const saved = attachedVideo
        ? await args.attachAndPoll((token) => persist(token))
        : await persist();
      if (!saved) return;
      if (args.lessonId) await args.changeStatus(saved.id, status);
      args.form.reset(values);
      args.clearAttachments();
      if (attachedVideo) args.clearVideo();
      if (!args.lessonId) args.navigateToLesson(saved.id);
    },
    [args],
  );
  const handleSaveDraft = args.form.handleSubmit((values) => submit(values, "draft"));
  const handlePublish = args.form.handleSubmit((values) => submit(values, "published"));
  return { handleSaveDraft, handlePublish };
}

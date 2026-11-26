import type { UseFormReturn } from "react-hook-form";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import { LESSON_FORM_DEFAULTS, type LessonFormValues } from "../schemas/lesson-form";
import { renderHook } from "../../../shared/testing/render-hook";
import { useLessonEditorSave } from "./useLessonEditorSave";

function createForm(values: LessonFormValues) {
  const reset = vi.fn();
  const form = {
    handleSubmit: (callback: (nextValues: LessonFormValues) => Promise<void>) => () =>
      callback(values),
    reset,
  } as unknown as UseFormReturn<LessonFormValues>;
  return { form, reset };
}

function createSavedLesson(id: string): CatalogLesson {
  return {
    id,
    courseId: "course-1",
    title: "Lesson",
    description: "",
    kind: "recorded",
    status: "draft",
    availableFrom: "2027-01-01T00:00:00.000Z",
    availableUntil: "2027-02-01T00:00:00.000Z",
    access: "free",
    videoState: "none",
    startLocked: false,
    attachments: [],
  };
}

describe("useLessonEditorSave", () => {
  it("sets status through creation for a new lesson", async () => {
    const { form } = createForm({
      ...LESSON_FORM_DEFAULTS,
      title: "New lesson",
      availableFromLocal: "2027-01-01T00:00",
      availableUntilLocal: "2027-02-01T00:00",
    });
    const saveLesson = vi.fn().mockResolvedValue(createSavedLesson("lesson-new"));
    const changeStatus = vi.fn();
    const hook = renderHook(() =>
      useLessonEditorSave({
        form,
        uploadState: { status: "idle" },
        attachmentUploadTokens: [],
        saveLesson,
        attachAndPoll: vi.fn(),
        changeStatus,
        clearAttachments: vi.fn(),
        clearVideo: vi.fn(),
        navigateToLesson: vi.fn(),
      }),
    );

    await act(async () => hook.result.handleSaveDraft());

    expect(saveLesson).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft" }),
      undefined,
    );
    expect(changeStatus).not.toHaveBeenCalled();
    hook.unmount();
  });

  it("updates an existing lesson then changes its status once", async () => {
    const { form } = createForm({
      ...LESSON_FORM_DEFAULTS,
      title: "Existing lesson",
      availableFromLocal: "2027-01-01T00:00",
      availableUntilLocal: "2027-02-01T00:00",
    });
    const saveLesson = vi.fn().mockResolvedValue(createSavedLesson("lesson-existing"));
    const changeStatus = vi.fn().mockResolvedValue(undefined);
    const hook = renderHook(() =>
      useLessonEditorSave({
        lessonId: "lesson-existing",
        form,
        uploadState: { status: "idle" },
        attachmentUploadTokens: [],
        saveLesson,
        attachAndPoll: vi.fn(),
        changeStatus,
        clearAttachments: vi.fn(),
        clearVideo: vi.fn(),
        navigateToLesson: vi.fn(),
      }),
    );

    await act(async () => hook.result.handlePublish());

    expect(saveLesson).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: expect.anything() }),
      "lesson-existing",
    );
    expect(changeStatus).toHaveBeenCalledExactlyOnceWith("lesson-existing", "published");
    hook.unmount();
  });
});

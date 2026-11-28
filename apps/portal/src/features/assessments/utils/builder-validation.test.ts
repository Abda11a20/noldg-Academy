import { MOCK_ASSESSMENTS } from "@noldg/api/mocks/fixtures/assessments";
import { describe, expect, it } from "vitest";
import {
  buildAssessmentCreateInput,
  buildAssessmentUpdateInput,
  buildDuplicateAssessmentInput,
  draftFromAssessment,
  emptyBuilderDraft,
  validateBuilderDraft,
} from "./builder-validation";

const baseDraft = () => ({
  ...emptyBuilderDraft(),
  title: "Midterm exam",
  start: "2027-02-01T10:00",
  end: "2027-02-01T12:00",
  selectedIds: ["q-1", "q-2"],
});

describe("assessment builder validation and payload helpers", () => {
  it("hydrates exam datetimes and homework day boundaries from existing assessments", () => {
    const examDraft = draftFromAssessment(MOCK_ASSESSMENTS.items[0]!);
    expect(examDraft.title).toBe(MOCK_ASSESSMENTS.items[0]!.title);
    expect(examDraft.start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/u);
    expect(examDraft.duration).toBe("90");
    expect(examDraft.maxAttempts).toBe("2");

    const homeworkDraft = draftFromAssessment(MOCK_ASSESSMENTS.items[2]!);
    expect(homeworkDraft.start).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect(homeworkDraft.end).toMatch(/^\d{4}-\d{2}-\d{2}$/u);
    expect(homeworkDraft.targetMode).toBe("selected_students");
    expect(homeworkDraft.studentIds).toEqual(["student-1"]);
  });

  it("reports every exam validation failure in priority order and accepts valid drafts", () => {
    expect(validateBuilderDraft("exam", { ...baseDraft(), title: "   " })).toBe("titleRequired");
    expect(validateBuilderDraft("exam", { ...baseDraft(), start: "" })).toBe("windowRequired");
    expect(
      validateBuilderDraft("exam", {
        ...baseDraft(),
        start: "2027-02-01T14:00",
        end: "2027-02-01T12:00",
      }),
    ).toBe("windowInvalid");
    expect(validateBuilderDraft("exam", { ...baseDraft(), duration: "0" })).toBe(
      "durationRequired",
    );
    expect(validateBuilderDraft("exam", { ...baseDraft(), maxAttempts: "0" })).toBe(
      "attemptsRequired",
    );
    expect(validateBuilderDraft("exam", { ...baseDraft(), selectedIds: [] })).toBe(
      "questionsRequired",
    );
    expect(validateBuilderDraft("exam", { ...baseDraft(), randomCount: "3" })).toBe("poolTooSmall");
    expect(
      validateBuilderDraft("exam", {
        ...baseDraft(),
        targetMode: "selected_students",
        studentIds: [],
      }),
    ).toBe("studentsRequired");
    expect(validateBuilderDraft("exam", baseDraft())).toBeNull();
  });

  it("builds day-level homework create payloads with fixed single attempt and no duration", () => {
    const homeworkDraft = {
      ...baseDraft(),
      start: "2027-03-01",
      end: "2027-03-05",
      duration: "",
      maxAttempts: "4",
      randomCount: "1",
      maxTabLeaves: "3",
      targetMode: "selected_students" as const,
      studentIds: ["student-1"],
    };
    expect(validateBuilderDraft("homework", homeworkDraft)).toBeNull();
    const payload = buildAssessmentCreateInput("course-1", "homework", homeworkDraft);
    expect(payload).toMatchObject({
      type: "homework",
      courseId: "course-1",
      maxAttempts: 1,
      randomCount: 1,
      maxTabLeaves: 3,
      targetMode: "selected_students",
      studentIds: ["student-1"],
    });
    expect(payload.durationMinutes).toBeUndefined();
    expect(payload.windowStart).toMatch(/Z$/u);
    expect(payload.windowEnd).toMatch(/Z$/u);
  });

  it("enforces extend-only closing windows for locked assessments and sends only windowEnd", () => {
    const lockedExam = MOCK_ASSESSMENTS.items[1]!;
    const lockedDraft = draftFromAssessment(lockedExam);
    expect(validateBuilderDraft("exam", lockedDraft, lockedExam)).toBe("endExtendOnly");

    const extendedDraft = { ...lockedDraft, end: "2027-01-01T15:00" };
    expect(validateBuilderDraft("exam", extendedDraft, lockedExam)).toBeNull();
    const updatePayload = buildAssessmentUpdateInput("exam", extendedDraft, lockedExam);
    expect(Object.keys(updatePayload)).toEqual(["windowEnd"]);
    expect(updatePayload.windowEnd).toMatch(/Z$/u);
  });

  it("builds editable update and duplicate payloads preserving optional settings", () => {
    const draftExam = MOCK_ASSESSMENTS.items[0]!;
    const draft = { ...draftFromAssessment(draftExam), title: "Updated review", maxTabLeaves: "0" };
    const updatePayload = buildAssessmentUpdateInput("exam", draft, draftExam);
    expect(updatePayload).toMatchObject({
      title: "Updated review",
      durationMinutes: 90,
      maxAttempts: 2,
      maxTabLeaves: 0,
    });

    const duplicate = buildDuplicateAssessmentInput(
      MOCK_ASSESSMENTS.items[1]!,
      "First exam (Copy)",
    );
    expect(duplicate).toMatchObject({
      type: "exam",
      title: "First exam (Copy)",
      randomCount: 2,
      maxTabLeaves: 2,
      questionIds: MOCK_ASSESSMENTS.items[1]!.questionIds,
    });
  });
});

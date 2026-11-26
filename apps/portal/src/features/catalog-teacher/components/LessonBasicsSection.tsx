import { useTranslation } from "react-i18next";
import { Textarea, TextField } from "@noldg/ui";
import type { UseFormRegisterReturn } from "react-hook-form";

interface LessonBasicsSectionProps {
  titleField: UseFormRegisterReturn<"title">;
  descriptionField: UseFormRegisterReturn<"description">;
  titleError?: string | undefined;
  descriptionError?: string | undefined;
}

/** Renders title and description fields for a lesson editor. @param props Bound fields and validation messages. */
export function LessonBasicsSection({
  titleField,
  descriptionField,
  titleError,
  descriptionError,
}: LessonBasicsSectionProps) {
  const { t } = useTranslation("catalog");
  return (
    <section className="space-y-4">
      <TextField
        {...titleField}
        {...(titleError ? { error: titleError } : {})}
        id="lesson-title"
        label={t("lessonTitle")}
        required
      />
      <Textarea
        {...descriptionField}
        {...(descriptionError ? { error: descriptionError } : {})}
        id="lesson-description"
        label={t("lessonDescription")}
        maxLength={5000}
      />
    </section>
  );
}

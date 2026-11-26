import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, DateTimeField } from "@noldg/ui";
import { isoToCairoLocal } from "../../../shared/time/time";
import type { LessonFormValues } from "../schemas/lesson-form";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";

interface LessonScheduleSectionProps {
  control: Control<LessonFormValues>;
  lesson?: CatalogLesson | undefined;
  disabled: boolean;
  validationMessage: (value: unknown) => string | undefined;
  startError: unknown;
  endError: unknown;
}

/** Renders Cairo-local schedule fields and backend-provided window restrictions. @param props Schedule values and restriction details. */
export function LessonScheduleSection({
  control,
  lesson,
  disabled,
  validationMessage,
  startError,
  endError,
}: LessonScheduleSectionProps) {
  const { t } = useTranslation("catalog");
  const startMessage = validationMessage(startError);
  const endMessage = validationMessage(endError);
  return (
    <section className="space-y-4">
      <Controller
        control={control}
        name="availableFromLocal"
        render={({ field }) => (
          <DateTimeField
            {...field}
            disabled={Boolean(lesson?.startLocked) || disabled}
            {...(startMessage ? { error: startMessage } : {})}
            hint={t("cairoTimeHint")}
            id="lesson-start"
            label={t("lessonStart")}
          />
        )}
      />
      {lesson?.startLocked ? <Alert tone="warning">{t("startLockedMessage")}</Alert> : null}
      <Controller
        control={control}
        name="availableUntilLocal"
        render={({ field }) => (
          <DateTimeField
            {...field}
            disabled={disabled}
            {...(endMessage ? { error: endMessage } : {})}
            hint={t("cairoTimeHint")}
            id="lesson-end"
            label={t("lessonEnd")}
            {...(lesson?.minimumAllowedEnd
              ? { min: isoToCairoLocal(lesson.minimumAllowedEnd) }
              : {})}
          />
        )}
      />
    </section>
  );
}

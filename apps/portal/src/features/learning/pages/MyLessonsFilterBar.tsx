import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import type { LessonAvailability } from "@noldg/api/contracts/learning";

const availabilityLabelKeys: Record<
  LessonAvailability,
  "availability.available" | "availability.upcoming" | "availability.ended"
> = {
  available: "availability.available",
  upcoming: "availability.upcoming",
  ended: "availability.ended",
};

export interface MyLessonsFilterBarProps {
  availability?: LessonAvailability;
  values: readonly LessonAvailability[];
  onChange: (availability?: LessonAvailability) => void;
}

/** Renders the accessible availability filter controls for the lesson list.
 * @param props Selected server availability and the URL-state change callback.
 */
export function MyLessonsFilterBar({ availability, values, onChange }: MyLessonsFilterBarProps) {
  const { t } = useTranslation("learning");
  return (
    <div aria-label={t("myLessons.filters")} className="flex flex-wrap gap-2" role="group">
      <Button onClick={() => onChange(undefined)} variant={!availability ? "primary" : "secondary"}>
        {t("myLessons.all")}
      </Button>
      {values.map((value) => (
        <Button
          key={value}
          onClick={() => onChange(value)}
          variant={availability === value ? "primary" : "secondary"}
        >
          {t(availabilityLabelKeys[value])}
        </Button>
      ))}
    </div>
  );
}

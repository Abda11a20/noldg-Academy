import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, ProgressBar, Text } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import { getStudentLessonPath } from "../../../shared/navigation/routes";
import { formatCairoDateTime } from "../../../shared/time/time";

function availabilityTone(availability: StudentLesson["availability"]) {
  if (availability === "available") return "success" as const;
  if (availability === "upcoming") return "info" as const;
  return "neutral" as const;
}

/** Renders a semantic list of lessons with progress and server availability.
 * @param props Lessons in the selected server page.
 */
export function MyLessonList({ items }: { items: readonly StudentLesson[] }) {
  const { t, i18n } = useTranslation("learning");
  return (
    <ul className="grid gap-3" aria-label={t("myLessons.title")}>
      {items.map((lesson) => (
        <li className="rounded-lg border border-border bg-surface p-4" key={lesson.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Link
                className="font-semibold text-foreground underline"
                to={getStudentLessonPath(lesson.id)}
              >
                {lesson.title}
              </Link>
              <Text size="sm" tone="muted">
                {t("myLessons.lessonContext", {
                  teacher: lesson.teacher.name,
                  course: lesson.course.name,
                })}
              </Text>
              <Text size="sm" tone="muted">
                {t("myLessons.lessonWindow", {
                  from: formatCairoDateTime(lesson.availableFrom, i18n.language),
                  to: formatCairoDateTime(lesson.availableUntil, i18n.language),
                })}
              </Text>
            </div>
            <Badge tone={availabilityTone(lesson.availability)}>
              {t(`availability.${lesson.availability}`)}
            </Badge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressBar
              label={t("myLessons.progress", { title: lesson.title })}
              value={lesson.progress.watchedPercent}
            />
            <Text size="sm">
              {t("myLessons.progressValue", { value: lesson.progress.watchedPercent })}
            </Text>
          </div>
          <Text className="mt-2" size="sm" tone="muted">
            {t(`myLessons.action.${lesson.availability}`)}
          </Text>
        </li>
      ))}
    </ul>
  );
}

import { useTranslation } from "react-i18next";
import { Badge, Breadcrumbs, Heading, Text } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { formatCairoDateTime } from "../../../shared/time/time";

function availabilityTone(availability: StudentLesson["availability"]) {
  if (availability === "available") return "success" as const;
  if (availability === "upcoming") return "info" as const;
  return "neutral" as const;
}

/** Renders lesson identity, server availability, and Cairo-time window.
 * @param props Lesson metadata and localized direction data.
 */
export function LessonHeader({ lesson, language }: { lesson: StudentLesson; language: string }) {
  const { t } = useTranslation("learning");
  return (
    <>
      <Breadcrumbs
        label={t("lesson.breadcrumbs")}
        items={[
          { label: t("myLessons.title"), to: ROUTE_PATHS.studentLessons },
          { label: lesson.title },
        ]}
      />
      <header className="flex flex-col gap-2">
        <Heading level={1}>{lesson.title}</Heading>
        <Text>
          {t("lesson.context", { teacher: lesson.teacher.name, course: lesson.course.name })}
        </Text>
        <Text size="sm" tone="muted">
          {t("lesson.window", {
            from: formatCairoDateTime(lesson.availableFrom, language),
            to: formatCairoDateTime(lesson.availableUntil, language),
          })}
        </Text>
        <Badge tone={availabilityTone(lesson.availability)}>
          {t(`availability.${lesson.availability}`)}
        </Badge>
      </header>
    </>
  );
}

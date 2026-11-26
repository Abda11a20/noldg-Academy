import { useTranslation } from "react-i18next";
import type { BrowseLesson } from "@noldg/api/contracts/browse";
import { Badge, Card, CardBody, Text } from "@noldg/ui";
import { formatCairoDateTime } from "../../../shared/time/time";

interface LessonPreviewRowProps {
  lesson: BrowseLesson;
  locale: string;
}

/** Displays only the server-provided availability and access for a lesson preview. */
export function LessonPreviewRow({ lesson, locale }: LessonPreviewRowProps) {
  const { t } = useTranslation("browse");
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text className="font-semibold">{lesson.title}</Text>
          <Text size="sm" tone="muted">
            {t("lessonWindow", {
              from: formatCairoDateTime(lesson.availableFrom, locale),
              until: formatCairoDateTime(lesson.availableUntil, locale),
            })}
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={lesson.availability === "available" ? "success" : "neutral"}>
            {t(`availability.${lesson.availability}`)}
          </Badge>
          <Badge tone="primary">{t(`access.${lesson.access}`)}</Badge>
        </div>
      </CardBody>
    </Card>
  );
}

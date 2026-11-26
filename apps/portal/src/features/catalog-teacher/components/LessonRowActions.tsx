import { useTranslation } from "react-i18next";
import { Button } from "@noldg/ui";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import { isAfterNow, isAfterTimestamp } from "../../../shared/time/time";

interface LessonRowActionsProps {
  lesson: CatalogLesson;
  statusPending: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  onArchive: () => void;
}

function canTogglePublication(lesson: CatalogLesson, statusPending: boolean): boolean {
  if (statusPending || lesson.status === "published") return !statusPending;
  return (
    lesson.videoState === "ready" &&
    isAfterNow(lesson.availableUntil, new Date()) &&
    isAfterTimestamp(lesson.availableUntil, lesson.availableFrom)
  );
}

/** Displays lesson row actions and disables publication when the window or video is invalid. @param props Lesson and event callbacks. */
export function LessonRowActions({
  lesson,
  statusPending,
  onEdit,
  onToggleStatus,
  onArchive,
}: LessonRowActionsProps) {
  const { t } = useTranslation("catalog");
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onEdit} size="sm" variant="secondary">
        {t("edit")}
      </Button>
      <Button
        disabled={!canTogglePublication(lesson, statusPending)}
        onClick={onToggleStatus}
        size="sm"
        variant="secondary"
      >
        {lesson.status === "published" ? t("unpublishLesson") : t("publishLesson")}
      </Button>
      <Button onClick={onArchive} size="sm" variant="danger">
        {t("archiveLesson")}
      </Button>
    </div>
  );
}

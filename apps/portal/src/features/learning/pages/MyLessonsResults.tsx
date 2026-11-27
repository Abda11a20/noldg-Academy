import { EmptyState, Button, Text } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import type { useMyLessons } from "../hooks/useLearningQueries";
import { LEARNING_SKELETON_COUNT } from "../constants";
import { MyLessonList } from "./MyLessonList";

type LessonListResult = ReturnType<typeof useMyLessons>;

function isForbidden(error: unknown): boolean {
  return error instanceof Error && "status" in error && error.status === 403;
}

export interface MyLessonsResultsProps {
  page: number;
  pageSize: number;
  result: LessonListResult;
  setPage: (page: number) => void;
}

/** Renders list loading, error, empty, and paginated result states.
 * @param props Query result and URL-backed pagination controls.
 */
export function MyLessonsResults({ page, pageSize, result, setPage }: MyLessonsResultsProps) {
  const { t } = useTranslation(["learning", "common"]);
  if (result.isPending) {
    return (
      <div aria-label={t("myLessons.loading")} className="grid gap-3" role="status">
        {Array.from({ length: LEARNING_SKELETON_COUNT }, (_, index) => (
          <div className="h-24 animate-pulse rounded-lg bg-surface-muted" key={index} />
        ))}
      </div>
    );
  }
  if (result.isError) {
    return (
      <section className="flex flex-col gap-3" role="alert">
        <Text>
          {isForbidden(result.error) ? t("myLessons.forbidden") : t("myLessons.loadError")}
        </Text>
        <Button onClick={() => void result.refetch()} variant="secondary">
          {t("myLessons.retry")}
        </Button>
      </section>
    );
  }
  if (result.data.items.length === 0) {
    return (
      <EmptyState
        icon="book"
        title={t("myLessons.emptyTitle")}
        description={t("myLessons.emptyDescription")}
      />
    );
  }
  return (
    <>
      <MyLessonList items={result.data.items} />
      {result.data.total > pageSize ? (
        <div className="flex items-center justify-between gap-3">
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)} variant="secondary">
            {t("common:pagination.previous")}
          </Button>
          <Text>{t("myLessons.page", { page })}</Text>
          <Button
            disabled={page * pageSize >= result.data.total}
            onClick={() => setPage(page + 1)}
            variant="secondary"
          >
            {t("common:pagination.next")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

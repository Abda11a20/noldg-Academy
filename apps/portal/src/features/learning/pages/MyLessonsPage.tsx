import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Heading } from "@noldg/ui";
import type { LessonAvailability, MyLessonsQuery } from "@noldg/api/contracts/learning";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { LEARNING_DEFAULT_PAGE_SIZE } from "../constants";
import { useMyLessons } from "../hooks/useLearningQueries";
import { MyLessonsFilterBar } from "../components/MyLessonsFilterBar";
import { MyLessonsResults } from "../components/MyLessonsResults";

const availabilityValues: readonly LessonAvailability[] = ["available", "upcoming", "ended"];

function getQuery(
  page: number,
  pageSize: number,
  filters: Record<string, string>,
  search: string,
): MyLessonsQuery {
  const availability = availabilityValues.find((value) => value === filters.availability);
  return {
    page,
    pageSize: pageSize || LEARNING_DEFAULT_PAGE_SIZE,
    ...(availability ? { availability } : {}),
    ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    ...(filters.courseId ? { courseId: filters.courseId } : {}),
    ...(search ? { search } : {}),
    sort: "availableUntil",
  };
}

/** Renders the student's URL-filtered lesson list using server availability and progress. */
export function MyLessonsPage() {
  const { t } = useTranslation("learning");
  const list = useListUrlState();
  const query = useMemo(
    () => getQuery(list.state.page, list.state.pageSize, list.state.filters, list.state.search),
    [list.state],
  );
  const result = useMyLessons(query);
  const setAvailability = (availability?: LessonAvailability) => {
    const filters = { ...list.state.filters };
    if (availability) filters.availability = availability;
    else delete filters.availability;
    list.setFilters(filters);
  };

  return (
    <section className="flex flex-col gap-5">
      <Heading level={1}>{t("myLessons.title")}</Heading>
      <MyLessonsFilterBar
        {...(query.availability ? { availability: query.availability } : {})}
        onChange={setAvailability}
        values={availabilityValues}
      />
      <MyLessonsResults
        page={query.page}
        pageSize={query.pageSize}
        result={result}
        setPage={list.setPage}
      />
    </section>
  );
}

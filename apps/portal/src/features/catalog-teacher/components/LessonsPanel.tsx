import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  Pagination,
  SearchField,
  Select,
  Skeleton,
} from "@noldg/ui";
import type { DataColumn } from "@noldg/ui";
import type { CatalogLesson } from "@noldg/api/contracts/catalog";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { formatCairoDateTime } from "../../../shared/time/time";
import { formatMoney, getFormattingLocale } from "../../../shared/i18n/formatting";
import { CATALOG_PAGE_SIZE_OPTIONS } from "../constants";
import { useCatalogQueries } from "../hooks/useCatalogQueries";
import { getNewTeacherLessonPath, getTeacherLessonPath } from "../../../shared/navigation/routes";
import { useCatalogMutations } from "../hooks/useCatalogMutations";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import { LessonRowActions } from "./LessonRowActions";
import type { TFunction } from "i18next";

type CatalogTranslate = TFunction<["catalog", "common", "errors"]>;
const LESSON_STATUS_LABELS = {
  draft: "catalog:draft",
  published: "catalog:published",
  archived: "catalog:archived",
} as const;
const VIDEO_STATE_LABELS = {
  none: "catalog:videoNone",
  uploading: "catalog:videoUploading",
  processing: "catalog:videoProcessing",
  ready: "catalog:videoReady",
  failed: "catalog:videoFailed",
} as const;

function makeLessonColumns(
  t: CatalogTranslate,
  language: string | undefined,
): DataColumn<CatalogLesson>[] {
  const locale = getFormattingLocale(language);
  return [
    { id: "title", header: t("catalog:lessonTitle"), render: (lesson) => lesson.title },
    {
      id: "status",
      header: t("catalog:lessonStatus"),
      render: (lesson) => (
        <Badge tone={lesson.status === "published" ? "success" : "neutral"}>
          {t(`catalog:${lesson.status}`)}
        </Badge>
      ),
    },
    {
      id: "window",
      header: t("catalog:lessonWindow"),
      render: (lesson) =>
        `${formatCairoDateTime(lesson.availableFrom, locale)} – ${formatCairoDateTime(lesson.availableUntil, locale)}`,
    },
    {
      id: "access",
      header: t("catalog:lessonAccess"),
      render: (lesson) => getLessonPriceLabel(lesson, t),
    },
    {
      id: "video",
      header: t("catalog:videoState"),
      render: (lesson) => t(VIDEO_STATE_LABELS[lesson.videoState]),
    },
  ];
}

function getLessonPriceLabel(lesson: CatalogLesson, t: CatalogTranslate): string {
  if (lesson.access === "free") return t("catalog:freeAccess");
  if (lesson.price === undefined) return t("catalog:paidAccess");
  return formatMoney(lesson.price);
}

function getLessonErrorContent(
  isError: boolean,
  error: unknown,
  retry: () => void,
  t: CatalogTranslate,
) {
  if (!isError) return undefined;
  const title = isForbiddenError(error) ? t("errors:forbidden") : t("catalog:coursesLoadError");
  return (
    <ErrorState description={title} onRetry={retry} retryLabel={t("catalog:retry")} title={title} />
  );
}

function getNextStatus(status: CatalogLesson["status"]): "draft" | "published" {
  return status === "published" ? "draft" : "published";
}

function confirmArchive(
  lesson: CatalogLesson | undefined,
  mutate: (variables: { lessonId: string; status: "archived" }) => void,
  clear: () => void,
): void {
  if (lesson) mutate({ lessonId: lesson.id, status: "archived" });
  clear();
}

function clearArchiveOnClose(open: boolean, clear: () => void): void {
  if (!open) clear();
}

interface LessonsPanelProps {
  courseId: string;
}

/** Renders a URL-backed, filterable course lesson list with responsive data states. @param props Course identifier. */
export function LessonsPanel({ courseId }: LessonsPanelProps) {
  const { t, i18n } = useTranslation(["catalog", "common"]);
  const navigate = useNavigate();
  const [archiveTarget, setArchiveTarget] = useState<CatalogLesson | undefined>();
  const mutations = useCatalogMutations(courseId);
  const { state, setSearch, setFilters, setPage, setPageSize } = useListUrlState();
  const { lessons } = useCatalogQueries(courseId, state, false);
  const columns = makeLessonColumns(t, i18n.resolvedLanguage);
  const statusOptions = [
    { value: "all", label: t("catalog:allStatuses") },
    ...Object.entries(LESSON_STATUS_LABELS).map(([value, key]) => ({ value, label: t(key) })),
  ];
  const accessOptions = [
    { value: "all", label: t("catalog:allAccessTypes") },
    { value: "free", label: t("catalog:freeAccess") },
    { value: "paid", label: t("catalog:paidAccess") },
  ];
  const availabilityOptions = [
    { value: "all", label: t("catalog:allAvailability") },
    { value: "available", label: t("catalog:availableNow") },
    { value: "unavailable", label: t("catalog:notAvailableNow") },
  ];
  const setFilter = (key: string, value: string) => {
    const filters = { ...state.filters };
    if (value === "all") delete filters[key];
    else filters[key] = value;
    setFilters(filters);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          label={t("catalog:searchLessons")}
          value={state.search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Select
          id="lesson-status-filter"
          label={t("catalog:statusFilter")}
          options={statusOptions}
          placeholder={t("catalog:allStatuses")}
          value={state.filters.status ?? "all"}
          onValueChange={(value) => setFilter("status", value)}
        />
        <Select
          id="lesson-access-filter"
          label={t("catalog:accessFilter")}
          options={accessOptions}
          placeholder={t("catalog:allAccessTypes")}
          value={state.filters.access ?? "all"}
          onValueChange={(value) => setFilter("access", value)}
        />
        <Select
          id="lesson-availability-filter"
          label={t("catalog:availabilityFilter")}
          options={availabilityOptions}
          placeholder={t("catalog:allAvailability")}
          value={state.filters.availability ?? "all"}
          onValueChange={(value) => setFilter("availability", value)}
        />
        <Button onClick={() => void navigate(getNewTeacherLessonPath(courseId))}>
          {t("catalog:createLesson")}
        </Button>
      </div>
      <DataTable
        columns={columns}
        emptyContent={
          <EmptyState
            description={t("catalog:lessonsEmptyDescription")}
            icon="book"
            title={t("catalog:lessonsEmptyTitle")}
          />
        }
        errorContent={getLessonErrorContent(
          lessons.isError,
          lessons.error,
          () => void lessons.refetch(),
          t,
        )}
        getRowKey={(lesson) => lesson.id}
        label={t("catalog:lessonsTitle")}
        loading={lessons.isPending}
        loadingContent={<Skeleton height="lg" />}
        rowActions={(lesson) => (
          <LessonRowActions
            lesson={lesson}
            onArchive={() => setArchiveTarget(lesson)}
            onEdit={() => void navigate(getTeacherLessonPath(courseId, lesson.id))}
            onToggleStatus={() =>
              mutations.changeLessonStatusMutation.mutate({
                lessonId: lesson.id,
                status: getNextStatus(lesson.status),
              })
            }
            statusPending={mutations.changeLessonStatusMutation.isPending}
          />
        )}
        rows={lessons.data?.items ?? []}
      />
      <ConfirmDialog
        cancelLabel={t("catalog:cancel")}
        closeLabel={t("catalog:cancel")}
        confirmLabel={t("catalog:archiveLesson")}
        description={t("catalog:archiveLessonDescription")}
        onConfirm={() => {
          confirmArchive(archiveTarget, mutations.changeLessonStatusMutation.mutate, () =>
            setArchiveTarget(undefined),
          );
        }}
        onOpenChange={(open) => clearArchiveOnClose(open, () => setArchiveTarget(undefined))}
        open={Boolean(archiveTarget)}
        title={t("catalog:archiveLesson")}
      />
      <Pagination
        nextLabel={t("catalog:nextPage")}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        page={lessons.data?.page ?? state.page}
        pageLabel={t("catalog:paginationLabel")}
        pageSize={state.pageSize}
        pageSizeLabel={t("catalog:pageSize")}
        pageSizeOptions={CATALOG_PAGE_SIZE_OPTIONS}
        pageSizePlaceholder={t("catalog:pageSizePlaceholder")}
        pageStatus={(page, pageCount) => t("common:pagination.status", { page, pageCount })}
        previousLabel={t("catalog:previousPage")}
        total={lessons.data?.total ?? 0}
      />
    </div>
  );
}

import { useMemo } from "react";
import { useNavigate } from "react-router";
import { AppError } from "@noldg/api/errors";
import type { TeacherApplication } from "@noldg/api/contracts/admin";
import {
  DataTable,
  DropdownMenu,
  ErrorState,
  Icon,
  SearchField,
  Select,
  Skeleton,
  type ErrorStateProps,
} from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { useTeacherApplicationList } from "../hooks/useTeacherAdministration";
import { ApplicationPagination } from "./ApplicationPagination";
import { formatCairoDateTime } from "../../../shared/time/time";
import { APPLICATION_STATUS_LABEL_KEYS, APPLICATION_STATUSES } from "../translation-keys";

function applicationError(
  error: unknown,
  t: (
    key:
      | "teachers.states.forbiddenTitle"
      | "teachers.states.forbiddenBody"
      | "teachers.states.unavailableTitle"
      | "teachers.states.unavailableBody"
      | "teachers.actions.retry",
  ) => string,
  retry: () => void,
): ErrorStateProps | undefined {
  if (!error) return undefined;
  const forbidden = error instanceof AppError && error.status === 403;
  const unavailable = error instanceof AppError && error.status === 501;
  const title = t(
    forbidden ? "teachers.states.forbiddenTitle" : "teachers.states.unavailableTitle",
  );
  const description = t(
    forbidden ? "teachers.states.forbiddenBody" : "teachers.states.unavailableBody",
  );
  if (unavailable) return { title, description };
  return { title, description, retryLabel: t("teachers.actions.retry"), onRetry: retry };
}

/** Renders paginated teacher applications with status filtering and row actions.
 * @returns Application list panel.
 */
export function ApplicationsPanel() {
  const { t } = useTranslation("admin");
  const navigate = useNavigate();
  const listState = useListUrlState();
  const status = listState.state.filters.status ?? "pending";
  const list = useTeacherApplicationList(listState.state, status);
  const rows = list.data?.items ?? [];
  const columns = useMemo(
    () => [
      {
        id: "name",
        header: t("teachers.fields.name"),
        render: (row: TeacherApplication) => row.name,
      },
      {
        id: "email",
        header: t("teachers.fields.email"),
        render: (row: TeacherApplication) => row.email,
      },
      {
        id: "status",
        header: t("teachers.fields.status"),
        render: (row: TeacherApplication) => t(APPLICATION_STATUS_LABEL_KEYS[row.status]),
      },
      {
        id: "submitted",
        header: t("teachers.fields.submitted"),
        render: (row: TeacherApplication) => formatCairoDateTime(row.submittedAt),
      },
    ],
    [t],
  );
  const errorState = applicationError(list.error, t, () => void list.refetch());
  const statusOptions = APPLICATION_STATUSES.map((value) => ({
    value,
    label: t(APPLICATION_STATUS_LABEL_KEYS[value]),
  }));
  const openApplication = (application: TeacherApplication) => {
    void navigate(ROUTE_PATHS.adminTeacherApplication.replace(":applicationId", application.id));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Select
          id="application-status"
          label={t("teachers.filters.status")}
          options={statusOptions}
          value={status}
          placeholder={t("teachers.filters.status")}
          onValueChange={(value) =>
            listState.setFilters({ ...listState.state.filters, status: value })
          }
        />
        <SearchField
          key={listState.searchKey}
          defaultValue={listState.state.search}
          label={t("teachers.filters.search")}
          onChange={(event) => listState.setSearch(event.currentTarget.value)}
        />
      </div>
      <DataTable
        label={t("teachers.tabs.applications")}
        actionColumnLabel={t("teachers.actions.view")}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
        loading={list.isLoading}
        loadingContent={<Skeleton className="h-32" />}
        emptyContent={<p>{t("teachers.states.empty")}</p>}
        {...(errorState ? { errorContent: <ErrorState {...errorState} /> } : {})}
        rowActions={(application) => (
          <DropdownMenu
            trigger={<Icon name="menu" />}
            triggerLabel={t("teachers.actions.view")}
            items={[
              {
                id: "view",
                label: t("teachers.actions.view"),
                onSelect: () => openApplication(application),
              },
            ]}
          />
        )}
      />
      <ApplicationPagination
        {...(list.data ? { data: list.data } : {})}
        labels={{
          page: t("list.pageLabel"),
          pageSize: t("list.pageSize"),
          placeholder: t("list.pageSizePlaceholder"),
          previous: t("list.previous"),
          next: t("list.next"),
        }}
        pageStatus={(page, count) => t("list.pageStatus", { page, count })}
        onPage={listState.setPage}
        onPageSize={listState.setPageSize}
      />
    </div>
  );
}

import { DataTable, ErrorState, SearchField, Skeleton } from "@noldg/ui";
import { TeacherAccountPagination } from "./TeacherAccountPagination";
import { TeacherAccountRowActions } from "./TeacherAccountRowActions";
import { TeacherAccountStatusDialog } from "./TeacherAccountStatusDialog";
import { useTeacherAccountsPanel } from "../hooks/useTeacherAccountsPanel";

interface TeacherAccountsPanelProps {
  status: "active" | "suspended";
}

/** Renders an active or suspended teacher account list and status actions.
 * @param props Account status tab to display.
 */
export function TeacherAccountsPanel({ status }: TeacherAccountsPanelProps) {
  const state = useTeacherAccountsPanel(status);
  const { t, listState, list } = state;
  const error = state.error ? <ErrorState {...state.error} /> : undefined;
  const title = t(status === "active" ? "teachers.tabs.active" : "teachers.tabs.suspended");
  const actionLabel = t(
    status === "active" ? "teachers.actions.suspend" : "teachers.actions.reactivate",
  );
  const dialogTitle = t(
    status === "active" ? "teachers.detail.suspendTitle" : "teachers.detail.reactivateTitle",
  );
  return (
    <div className="space-y-4">
      <SearchField
        key={listState.searchKey}
        defaultValue={listState.state.search}
        label={t("teachers.filters.search")}
        onChange={(event) => listState.setSearch(event.currentTarget.value)}
      />
      <DataTable
        label={title}
        actionColumnLabel={actionLabel}
        columns={state.columns}
        rows={list.data?.items ?? []}
        getRowKey={(row) => row.id}
        loading={list.isLoading}
        loadingContent={<Skeleton className="h-32" />}
        emptyContent={<p>{t("teachers.states.empty")}</p>}
        {...(error ? { errorContent: error } : {})}
        rowActions={(row) => (
          <TeacherAccountRowActions
            account={row}
            actionLabel={actionLabel}
            nextStatus={state.nextStatus}
            onSelect={state.setSelected}
          />
        )}
      />
      <TeacherAccountPagination
        {...(list.data ? { data: list.data } : {})}
        pageLabel={t("list.pageLabel")}
        pageSizeLabel={t("list.pageSize")}
        placeholder={t("list.pageSizePlaceholder")}
        previousLabel={t("list.previous")}
        nextLabel={t("list.next")}
        pageStatus={(page, count) => t("list.pageStatus", { page, count })}
        onPage={listState.setPage}
        onPageSize={listState.setPageSize}
      />
      <TeacherAccountStatusDialog
        {...(state.selected ? { account: state.selected } : {})}
        title={dialogTitle}
        closeLabel={t("common.close")}
        confirmLabel={t("teachers.actions.save")}
        cancelLabel={t("academic.actions.cancel")}
        reasonLabel={t("teachers.fields.reason")}
        reasonHint={t("teachers.detail.reasonHint", { count: 10 })}
        onOpenChange={(open) => {
          if (!open) state.setSelected(undefined);
        }}
        onConfirm={state.confirmStatus}
      />
    </div>
  );
}

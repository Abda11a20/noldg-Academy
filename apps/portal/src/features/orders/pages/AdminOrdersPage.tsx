import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppError } from "@noldg/api/errors";
import {
  Button,
  EmptyState,
  ErrorState,
  Heading,
  Pagination,
  SearchField,
  Skeleton,
  Tabs,
} from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import type { OrderListQuery } from "@noldg/api/contracts/orders";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { getAdminOrderPath, ROUTE_PATHS } from "../../../shared/navigation/routes";
import { OrderCard } from "../components/OrderCard";
import { useAdminOrders } from "../hooks/useOrders";
import { AdminOrderFilters } from "./AdminOrderFilters";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const ORDER_STATUSES = ["awaiting_payment", "completed", "rejected", "closed"] as const;

function getOrderStatus(value: string | undefined): OrderListQuery["status"] {
  return value && ORDER_STATUSES.includes(value as (typeof ORDER_STATUSES)[number])
    ? (value as OrderListQuery["status"])
    : undefined;
}

function getAdvancedFilters(filters: Record<string, string>, enabled: boolean) {
  if (!enabled) return {};
  return {
    ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.expiringSoon === "true" ? { expiringSoon: true } : {}),
  };
}

function buildOrderQuery(
  page: number,
  pageSize: number,
  search: string,
  filters: Record<string, string>,
  filtersEnabled: boolean,
): OrderListQuery {
  const status = filters.status;
  return {
    page,
    pageSize,
    search,
    ...(getOrderStatus(status) ? { status: getOrderStatus(status) } : {}),
    ...getAdvancedFilters(filters, filtersEnabled),
  };
}

/** Renders the admin review queue using server-side list state and pagination. */
export function AdminOrdersPage() {
  const { t } = useTranslation("orders");
  const list = useListUrlState();
  const status = list.state.filters.status;
  const filtersEnabled = capabilities.orderAdminFilters;
  const query = useMemo(
    () =>
      buildOrderQuery(
        list.state.page,
        list.state.pageSize,
        list.state.search,
        list.state.filters,
        filtersEnabled,
      ),
    [list.state, filtersEnabled],
  );
  const result = useAdminOrders(query);
  if (result.isPending)
    return (
      <section className="space-y-4">
        <Heading level={1}>{t("ordersTitle")}</Heading>
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </section>
    );
  if (result.isError)
    return (
      <ErrorState
        title={t("loadError")}
        description={
          result.error instanceof AppError && result.error.status === 403
            ? t("403")
            : t("loadError")
        }
        retryLabel={t("retry")}
        onRetry={() => void result.refetch()}
      />
    );
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{t("ordersTitle")}</Heading>
        <Button to={ROUTE_PATHS.adminManualOrder}>{t("manualTitle")}</Button>
      </div>
      <SearchField
        id="orders-search"
        label={t("search")}
        value={list.state.search}
        onChange={(event) => list.setSearch(event.currentTarget.value)}
      />
      {filtersEnabled ? (
        <AdminOrderFilters filters={list.state.filters} onChange={list.setFilters} />
      ) : null}
      <Tabs
        label={t("statusLabel")}
        value={status ?? "all"}
        onValueChange={(value) => {
          const nextFilters = { ...list.state.filters };
          if (value === "all") delete nextFilters.status;
          else nextFilters.status = value;
          list.setFilters(nextFilters);
        }}
        items={[
          { value: "all", label: t("allStatuses"), content: null },
          { value: "awaiting_payment", label: t("status.awaiting_payment"), content: null },
          { value: "completed", label: t("status.completed"), content: null },
          { value: "rejected", label: t("status.rejected"), content: null },
          { value: "closed", label: t("closed"), content: null },
        ]}
      />
      {result.data.items.length ? (
        <div className="space-y-3">
          {result.data.items.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              href={getAdminOrderPath(order.id)}
              labels={{
                awaiting_payment: t("status.awaiting_payment"),
                completed: t("status.completed"),
                rejected: t("status.rejected"),
                expired: t("status.expired"),
                cancelled: t("status.cancelled"),
              }}
              remainingLabel={t("remainingTime")}
              receivedAtMs={result.dataUpdatedAt}
              adminView
              adminLabels={{
                student: (value) => t("studentWithValue", { value }),
                teacher: (value) => t("teacherWithValue", { value }),
                sender: (value) => t("senderWithValue", { value }),
                methods: {
                  instapay: t("methods.instapay"),
                  wallet: t("methods.wallet"),
                  cash: t("methods.cash"),
                },
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon="book" title={t("emptyTitle")} description={t("emptyDescription")} />
      )}
      <Pagination
        page={result.data.page}
        pageSize={result.data.pageSize}
        total={result.data.total}
        pageLabel={t("ordersTitle")}
        pageSizeLabel={t("pageSize")}
        pageSizePlaceholder={t("pageSize")}
        previousLabel={t("previous")}
        nextLabel={t("next")}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageStatus={(page, pages) => t("page", { page, pages })}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
    </section>
  );
}

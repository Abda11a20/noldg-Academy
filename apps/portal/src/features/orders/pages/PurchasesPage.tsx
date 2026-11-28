import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, ErrorState, Heading, Pagination, Select, Skeleton } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import type { OrderListQuery } from "@noldg/api/contracts/orders";
import { useListUrlState } from "../../../shared/navigation/useListUrlState";
import { getStudentPurchasePath } from "../../../shared/navigation/routes";
import { OrderCard } from "../components/OrderCard";
import { useStudentOrders } from "../hooks/useOrders";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const STUDENT_ORDER_STATUSES = [
  "awaiting_payment",
  "completed",
  "rejected",
  "expired",
  "cancelled",
  "closed",
] as const;

function parseStudentOrderStatus(value: string | undefined): OrderListQuery["status"] {
  return STUDENT_ORDER_STATUSES.find((status) => status === value);
}

/** Renders the student purchase history with URL-backed status and paging state. */
export function PurchasesPage() {
  const { t } = useTranslation("orders");
  const list = useListUrlState();
  const status = parseStudentOrderStatus(list.state.filters.status);
  const query = useMemo(
    () => ({
      page: list.state.page,
      pageSize: list.state.pageSize,
      ...(status ? { status } : {}),
    }),
    [list.state.page, list.state.pageSize, status],
  );
  const result = useStudentOrders(query);
  if (result.isPending)
    return (
      <section className="space-y-4">
        <Heading level={1}>{t("listTitle")}</Heading>
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
      <Heading level={1}>{t("listTitle")}</Heading>
      <Select
        id="purchase-status"
        label={t("statusLabel")}
        placeholder={t("allStatuses")}
        value={status ?? "all"}
        onValueChange={(value) => list.setFilters(value === "all" ? {} : { status: value })}
        options={[
          { value: "all", label: t("allStatuses") },
          { value: "awaiting_payment", label: t("status.awaiting_payment") },
          { value: "completed", label: t("status.completed") },
          { value: "rejected", label: t("status.rejected") },
          { value: "expired", label: t("status.expired") },
          { value: "cancelled", label: t("status.cancelled") },
        ]}
      />
      {result.data.items.length ? (
        <div className="space-y-3">
          {result.data.items.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              href={getStudentPurchasePath(order.id)}
              labels={{
                awaiting_payment: t("status.awaiting_payment"),
                completed: t("status.completed"),
                rejected: t("status.rejected"),
                expired: t("status.expired"),
                cancelled: t("status.cancelled"),
              }}
              remainingLabel={t("remainingTime")}
              receivedAtMs={result.dataUpdatedAt}
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
        pageLabel={t("listTitle")}
        pageSizeLabel={t("pageSize")}
        pageSizePlaceholder={t("pageSize")}
        previousLabel={t("previous")}
        nextLabel={t("next")}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pageStatus={(page, pages) => t("page", { page, pages })}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
      <Button variant="ghost" onClick={() => void result.refetch()}>
        {t("refresh")}
      </Button>
    </section>
  );
}

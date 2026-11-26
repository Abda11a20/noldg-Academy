import { useTranslation } from "react-i18next";
import { Badge, Button, DataTable, EmptyState, ErrorState, Skeleton } from "@noldg/ui";
import type { DataColumn } from "@noldg/ui";
import type { CatalogProduct } from "@noldg/api/contracts/catalog";
import type { TFunction } from "i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import { isForbiddenError } from "../../../shared/errors/isForbiddenError";
import type { BundleRow } from "../hooks/useBundlePanelState";

interface BundleListTableProps {
  rows: BundleRow[];
  loading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onEdit: (product: CatalogProduct) => void;
  onArchive: (product: CatalogProduct) => void;
}

function makeColumns(t: TFunction<["catalog", "errors"]>): DataColumn<BundleRow>[] {
  return [
    { id: "name", header: t("catalog:bundleName"), render: ({ product }) => product.name },
    {
      id: "price",
      header: t("catalog:bundlePrice"),
      render: ({ product }) => formatMoney(product.price),
    },
    {
      id: "announced",
      header: t("catalog:announcedLessonCount"),
      render: ({ product }) => product.announcedLessonCount ?? t("catalog:countsUnavailable"),
    },
    {
      id: "current-count",
      header: t("catalog:currentLessonCount"),
      render: ({ product }) => product.lessonIds?.length ?? t("catalog:countsUnavailable"),
    },
    {
      id: "student-price",
      header: t("catalog:studentPriceNow"),
      render: ({ pricing }) => formatMoney(pricing.currentPrice),
    },
    {
      id: "status",
      header: t("catalog:lessonStatus"),
      render: ({ product }) => <Badge>{t(`catalog:${product.status}`)}</Badge>,
    },
  ];
}

/** Displays package rows, server pricing, loading, empty, and permission errors. @param props Package rows and actions. */
export function BundleListTable(props: BundleListTableProps) {
  const { t } = useTranslation(["catalog", "errors"]);
  const errorTitle = isForbiddenError(props.error)
    ? t("errors:forbidden")
    : t("errors:requestFailed");
  const errorContent = props.isError ? (
    <ErrorState
      description={errorTitle}
      onRetry={props.onRetry}
      retryLabel={t("catalog:retry")}
      title={errorTitle}
    />
  ) : undefined;
  return (
    <DataTable
      columns={makeColumns(t)}
      emptyContent={
        <EmptyState
          description={t("catalog:bundlesEmptyDescription")}
          icon="book"
          title={t("catalog:bundlesEmptyTitle")}
        />
      }
      errorContent={errorContent}
      getRowKey={({ product }) => product.id}
      label={t("catalog:bundlesTitle")}
      loading={props.loading}
      loadingContent={<Skeleton height="lg" />}
      rowActions={({ product }) => (
        <div className="flex gap-2">
          <Button onClick={() => props.onEdit(product)} size="sm" variant="secondary">
            {t("catalog:edit")}
          </Button>
          <Button onClick={() => props.onArchive(product)} size="sm" variant="danger">
            {t("catalog:archiveBundle")}
          </Button>
        </div>
      )}
      rows={props.rows}
    />
  );
}

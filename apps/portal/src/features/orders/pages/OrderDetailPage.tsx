import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ErrorState, Heading } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { useCancelOrder, useOrder, useOrderSettings } from "../hooks/useOrders";
import { StudentOrderSnapshot } from "./StudentOrderSnapshot";

/** Displays one student's order snapshot and cancellation action while awaiting payment. */
export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const { t } = useTranslation("orders");
  const query = useOrder(orderId);
  const settings = useOrderSettings();
  const cancel = useCancelOrder();
  if (query.isPending)
    return (
      <div aria-busy="true">
        <Heading level={1}>{t("details")}</Heading>
      </div>
    );
  if (query.isError || !query.data)
    return (
      <ErrorState
        title={t("loadError")}
        description={
          query.error instanceof AppError && query.error.status === 403 ? t("403") : t("loadError")
        }
        retryLabel={t("retry")}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <section className="space-y-5">
      <Heading level={1}>{t("details")}</Heading>
      <StudentOrderSnapshot
        order={query.data}
        supportNumber={settings.data?.supportWhatsappNumber ?? null}
        onCancel={() => cancel.mutateAsync(query.data.id).then(() => undefined)}
      />
    </section>
  );
}

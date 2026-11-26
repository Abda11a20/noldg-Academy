import type { OrderSummary } from "@noldg/api/contracts/orders";
import { Text } from "@noldg/ui";
import { useTranslation } from "react-i18next";
import { formatCairoDateTime } from "../../../shared/time/time";

interface OrderTimelineProps {
  order: OrderSummary;
}

/** Shows the known order and payment timestamps without inventing missing history.
 * @param props Order snapshot returned by the server.
 */
export function OrderTimeline({ order }: OrderTimelineProps): React.ReactElement {
  const { t, i18n } = useTranslation("orders");
  return (
    <ol aria-label={t("timeline.label")} className="space-y-2">
      <li>
        <Text>
          {t("timeline.created", { date: formatCairoDateTime(order.createdAt, i18n.language) })}
        </Text>
      </li>
      {order.payment?.createdAt ? (
        <li>
          <Text>
            {t("timeline.paymentSubmitted", {
              date: formatCairoDateTime(order.payment.createdAt, i18n.language),
            })}
          </Text>
        </li>
      ) : null}
      <li>
        <Text>{t("timeline.currentStatus", { status: t(`status.${order.status}`) })}</Text>
      </li>
    </ol>
  );
}

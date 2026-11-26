import { Button, Card, CardBody, CopyButton, Heading, Link, Text } from "@noldg/ui";
import type { OrderSummary } from "@noldg/api/contracts/orders";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import { formatCairoDateTime } from "../../../shared/time/time";
import { buildWhatsappLink } from "../../../shared/whatsapp/whatsapp";
import { getStudentPurchasesPath } from "../../../shared/navigation/routes";
import { useCopyValue } from "../hooks/useCopyValue";

interface CheckoutReceiptProps {
  order: OrderSummary;
  fallbackSenderNumber: string;
  supportNumber: string | null;
}

/** Shows the created order number and the available next actions.
 * @param props Created order and support contact data.
 */
export function CheckoutReceipt(props: CheckoutReceiptProps): React.ReactElement {
  const { t, i18n } = useTranslation("orders");
  const { copiedValue, copy } = useCopyValue();
  const order = props.order;
  const whatsapp = props.supportNumber
    ? buildWhatsappLink(
        props.supportNumber,
        t("whatsappMessage", {
          orderNumber: order.orderNumber,
          productName: order.product.name,
          amount: formatMoney(order.priceSnapshot.amount),
          senderNumber: order.senderRef ?? props.fallbackSenderNumber,
        }),
      )
    : null;
  return (
    <section className="space-y-5">
      <Heading level={1}>{t("orderCreated")}</Heading>
      <Card>
        <CardBody className="space-y-3">
          <Text className="text-xl font-bold">
            {t("orderNumber", { number: order.orderNumber })}
          </Text>
          {order.expiresAt ? (
            <Text>
              {t("expiry", { date: formatCairoDateTime(order.expiresAt, i18n.language) })}
            </Text>
          ) : null}
          <CopyButton
            value={order.orderNumber}
            label={t("copy")}
            copiedLabel={t("copied")}
            copied={copiedValue === order.orderNumber}
            onCopy={(value) => void copy(value)}
          />
          {whatsapp ? (
            <Button onClick={() => window.open(whatsapp, "_blank", "noopener,noreferrer")}>
              {t("whatsapp")}
            </Button>
          ) : null}
          <Link to={getStudentPurchasesPath()}>{t("purchases")}</Link>
        </CardBody>
      </Card>
    </section>
  );
}

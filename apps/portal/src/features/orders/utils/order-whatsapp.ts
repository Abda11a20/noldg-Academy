import type { OrderSummary } from "@noldg/api/contracts/orders";
import type { TFunction } from "i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import { buildWhatsappLink } from "../../../shared/whatsapp/whatsapp";

/** Builds a localized WhatsApp support link prefilled with order details.
 * @param phone Recipient phone number; returns null when absent or invalid.
 * @param order Order summary whose number, product, price, and sender reference populate the message.
 * @param t Orders translation function.
 * @param fallbackSenderNumber Fallback sender reference when the order lacks one.
 * @returns Sanitized WhatsApp URL or null.
 */
export function buildOrderWhatsappLink(
  phone: string | null | undefined,
  order: OrderSummary,
  t: TFunction<"orders">,
  fallbackSenderNumber = "",
): string | null {
  if (!phone) return null;
  return buildWhatsappLink(
    phone,
    t("whatsappMessage", {
      orderNumber: order.orderNumber,
      productName: order.product.name,
      amount: formatMoney(order.priceSnapshot.amount),
      senderNumber: order.senderRef ?? fallbackSenderNumber,
    }),
  );
}

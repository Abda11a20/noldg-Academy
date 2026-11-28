import { Badge, Link } from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { useTranslation } from "react-i18next";
import { getStudentPurchasePath } from "../../../shared/navigation/routes";

/** Displays a localized checkout request error and a link to any conflicting open order.
 * @param props Request error thrown while creating the order.
 */
export function CheckoutRequestError({ error }: { error: unknown }): React.ReactElement | null {
  const { t } = useTranslation("orders");
  if (!error) return null;
  const code = error instanceof AppError ? error.code : "REQUEST_FAILED";
  const existingOrderId =
    error instanceof AppError &&
    error.code === "ORDER_ALREADY_OPEN" &&
    typeof error.details === "object" &&
    error.details !== null &&
    "orderId" in error.details &&
    typeof error.details.orderId === "string"
      ? error.details.orderId
      : null;
  return (
    <div className="space-y-2">
      <Badge tone="danger">
        {t(`errors.${code}`, { defaultValue: t("errors.REQUEST_FAILED") })}
      </Badge>
      {existingOrderId ? (
        <Link to={getStudentPurchasePath(existingOrderId)}>{t("openExisting")}</Link>
      ) : null}
    </div>
  );
}

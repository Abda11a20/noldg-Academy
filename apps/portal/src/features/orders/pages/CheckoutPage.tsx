import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, Spinner } from "@noldg/ui";
import { useOrderSettings, usePricingPreview } from "../hooks/useOrders";
import { CheckoutReady } from "./CheckoutReady";

/** Loads server-authoritative checkout data and composes the appropriate page state.
 * @returns Loading, safe error, or checkout form state.
 */
export function CheckoutPage(): React.ReactElement {
  const { productId = "" } = useParams();
  const { t } = useTranslation("orders");
  const pricing = usePricingPreview(productId);
  const settings = useOrderSettings();
  if (pricing.isPending || settings.isPending)
    return (
      <div aria-label={t("pending")} role="status">
        <Spinner />
      </div>
    );
  if (pricing.isError || settings.isError || !pricing.data || !settings.data)
    return (
      <ErrorState
        title={t("loadError")}
        description={t("checkoutUnavailable")}
        retryLabel={t("retry")}
        onRetry={() => {
          void pricing.refetch();
          void settings.refetch();
        }}
      />
    );
  if (!pricing.data.pricing.isPurchasable)
    return <EmptyState icon="book" title={t("unavailable")} description={t("unavailable")} />;
  return (
    <CheckoutReady
      productId={productId}
      productName={pricing.data.product.name}
      pricing={pricing.data.pricing}
      settings={settings.data}
    />
  );
}

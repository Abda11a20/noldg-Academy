import { useTranslation } from "react-i18next";
import type { BrowseProduct } from "@noldg/api/contracts/browse";
import { Button, Card, CardBody, Text } from "@noldg/ui";
import { formatMoney } from "../../../shared/i18n/formatting";
import { getStudentCheckoutPath } from "../../../shared/navigation/routes";

interface BrowseProductCardProps {
  product: BrowseProduct;
}

/** Shows server-supplied product pricing and remaining lesson information. */
export function BrowseProductCard({ product }: BrowseProductCardProps) {
  const { t } = useTranslation("browse");
  const lessonCount =
    product.pricing.remainingCount === undefined
      ? t("announcedLessons", { announced: product.pricing.announcedCount })
      : t("productLessons", {
          announced: product.pricing.announcedCount,
          remaining: product.pricing.remainingCount,
        });
  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text className="font-semibold">{product.name}</Text>
          <Text size="sm" tone="muted">
            {lessonCount}
          </Text>
          <Text size="sm">
            {t("studentPrice", { price: formatMoney(product.pricing.priceNow) })}
          </Text>
        </div>
        <Button
          to={getStudentCheckoutPath(product.id)}
          variant="primary"
          disabled={!product.pricing.purchasable}
        >
          {t(product.pricing.purchasable ? "subscribe" : "notPurchasable")}
        </Button>
      </CardBody>
    </Card>
  );
}

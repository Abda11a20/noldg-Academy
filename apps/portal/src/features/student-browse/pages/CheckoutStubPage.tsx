import { useTranslation } from "react-i18next";
import { EmptyState, Heading } from "@noldg/ui";

/** Shows the approved placeholder until student checkout is implemented in a later step. */
export function CheckoutStubPage() {
  const { t } = useTranslation("browse");
  return (
    <section className="flex flex-col gap-4">
      <Heading level={1}>{t("checkoutTitle")}</Heading>
      <EmptyState
        icon="book"
        title={t("checkoutUnavailableTitle")}
        description={t("checkoutUnavailableDescription")}
      />
    </section>
  );
}

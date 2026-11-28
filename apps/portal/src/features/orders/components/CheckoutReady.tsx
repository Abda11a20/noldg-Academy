import { useTranslation } from "react-i18next";
import { Button, Heading, Stepper } from "@noldg/ui";
import type { OrderSettings } from "@noldg/api/contracts/orders";
import type { ProductPricing } from "@noldg/api/contracts/catalog";
import { useNavigate } from "react-router";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutReceipt } from "./CheckoutReceipt";
import { useCheckoutFlow } from "../hooks/useCheckoutFlow";
import { useCopyValue } from "../hooks/useCopyValue";

interface CheckoutReadyProps {
  productId: string;
  productName: string;
  pricing: ProductPricing;
  settings: OrderSettings;
}

/** Renders the interactive checkout flow after pricing and settings load.
 * @param props Validated server pricing and payment settings.
 */
export function CheckoutReady(props: CheckoutReadyProps): React.ReactElement {
  const { t, i18n } = useTranslation("orders");
  const navigate = useNavigate();
  const flow = useCheckoutFlow(props.productId);
  const { copiedValue, copy } = useCopyValue();
  if (flow.createdOrder)
    return (
      <CheckoutReceipt
        order={flow.createdOrder}
        fallbackSenderNumber={flow.senderRef}
        supportNumber={props.settings.supportWhatsappNumber}
      />
    );
  const paymentInstructions =
    typeof props.settings.paymentInstructions === "string"
      ? props.settings.paymentInstructions
      : (props.settings.paymentInstructions[i18n.language === "ar" ? "ar" : "en"] ?? "");
  return (
    <section className="space-y-5">
      <Heading level={1}>{t("checkoutTitle")}</Heading>
      <Stepper
        steps={t("steps", { returnObjects: true }) as string[]}
        currentStep={flow.step}
        label={t("stepsLabel")}
      />
      <CheckoutForm
        pricing={props.pricing}
        productName={props.productName}
        paymentInstructions={paymentInstructions}
        supportNumber={props.settings.supportWhatsappNumber}
        step={flow.step}
        method={flow.method}
        senderRef={flow.senderRef}
        senderRefTouched={flow.senderRefTouched}
        isSenderValid={flow.isSenderValid}
        error={flow.create.error}
        pending={flow.create.isPending}
        copiedValue={copiedValue}
        onMethodChange={flow.setMethod}
        onSenderChange={flow.setSenderRef}
        onSenderBlur={() => flow.setSenderRefTouched(true)}
        onCopy={(value) => void copy(value)}
        onStepChange={flow.changeStep}
        onConfirm={() => void flow.submit()}
      />
      <Button variant="ghost" onClick={() => navigate(-1)}>
        {t("back")}
      </Button>
    </section>
  );
}

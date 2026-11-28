import { Button, Card, CardBody, Text } from "@noldg/ui";
import type { ProductPricing } from "@noldg/api/contracts/catalog";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import {
  CheckoutPaymentDetails,
  type CheckoutMethod,
  type CheckoutPaymentDetailsProps,
} from "./CheckoutPaymentDetails";
import { CheckoutRequestError } from "./CheckoutRequestError";

interface CheckoutFormProps extends CheckoutPaymentDetailsProps {
  pricing: ProductPricing;
  productName: string;
  error: unknown;
  pending: boolean;
  onMethodChange: (value: CheckoutMethod) => void;
  onStepChange: (step: number) => void;
  onConfirm: () => void;
}

/** Renders the review, payment, and confirmation form for checkout.
 * @param props Display state and actions supplied by the page hook.
 */
export function CheckoutForm(props: CheckoutFormProps): React.ReactElement {
  const { t } = useTranslation("orders");
  return (
    <Card>
      <CardBody className="space-y-4">
        <Text>{props.productName}</Text>
        <Text>{t("priceNow", { price: formatMoney(props.pricing.currentPrice) })}</Text>
        <Text size="sm" tone="muted">
          {t("counts", {
            remaining: props.pricing.remainingLessonCount,
            announced: props.pricing.announcedLessonCount,
          })}
        </Text>
        <CheckoutPaymentDetails
          paymentInstructions={props.paymentInstructions}
          supportNumber={props.supportNumber}
          step={props.step}
          method={props.method}
          senderRef={props.senderRef}
          senderRefTouched={props.senderRefTouched}
          isSenderValid={props.isSenderValid}
          copiedValue={props.copiedValue}
          onMethodChange={props.onMethodChange}
          onSenderChange={props.onSenderChange}
          onSenderBlur={props.onSenderBlur}
          onCopy={props.onCopy}
        />
        <CheckoutRequestError error={props.error} />
        <div className="flex flex-wrap gap-3">
          {props.step > 1 ? (
            <Button variant="secondary" onClick={() => props.onStepChange(props.step - 1)}>
              {t("back")}
            </Button>
          ) : null}
          {props.step < 3 ? (
            <Button
              onClick={() => props.onStepChange(props.step + 1)}
              disabled={props.step === 2 && !props.isSenderValid}
            >
              {t("continue")}
            </Button>
          ) : (
            <Button
              onClick={props.onConfirm}
              disabled={!props.isSenderValid || props.pending}
              loading={props.pending}
            >
              {props.pending ? t("pending") : t("confirm")}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

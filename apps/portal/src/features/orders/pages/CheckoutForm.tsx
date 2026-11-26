import {
  Badge,
  Button,
  Card,
  CardBody,
  CopyButton,
  Link,
  RadioGroup,
  Text,
  TextField,
} from "@noldg/ui";
import type { PaymentMethod } from "@noldg/api/contracts/orders";
import type { ProductPricing } from "@noldg/api/contracts/catalog";
import { AppError } from "@noldg/api/errors";
import { useTranslation } from "react-i18next";
import { formatMoney } from "../../../shared/i18n/formatting";
import { getStudentPurchasePath } from "../../../shared/navigation/routes";

type CheckoutMethod = Extract<PaymentMethod, "instapay" | "wallet">;

interface CheckoutFormProps {
  pricing: ProductPricing;
  productName: string;
  paymentInstructions: string;
  supportNumber: string | null;
  step: number;
  method: CheckoutMethod;
  senderRef: string;
  senderRefTouched: boolean;
  isSenderValid: boolean;
  error: unknown;
  pending: boolean;
  copiedValue: string | null;
  onMethodChange: (value: CheckoutMethod) => void;
  onSenderChange: (value: string) => void;
  onSenderBlur: () => void;
  onCopy: (value: string) => void;
  onStepChange: (step: number) => void;
  onConfirm: () => void;
}

function PaymentDetails(props: CheckoutFormProps): React.ReactElement | null {
  const { t } = useTranslation("orders");
  if (props.step < 2) return null;
  return (
    <>
      <RadioGroup
        id="payment-method"
        label={t("paymentMethod")}
        value={props.method}
        onValueChange={(value) => props.onMethodChange(value as CheckoutMethod)}
        options={[
          { value: "instapay", label: t("methods.instapay") },
          { value: "wallet", label: t("methods.wallet") },
        ]}
      />
      <Text>{t("paymentInstructionsWithValue", { value: props.paymentInstructions })}</Text>
      {props.paymentInstructions ? (
        <CopyButton
          value={props.paymentInstructions}
          label={t("copy")}
          copiedLabel={t("copied")}
          copied={props.copiedValue === props.paymentInstructions}
          onCopy={props.onCopy}
        />
      ) : null}
      {props.supportNumber ? (
        <>
          <Text>{t("supportNumberWithValue", { value: props.supportNumber })}</Text>
          <CopyButton
            value={props.supportNumber}
            label={t("copy")}
            copiedLabel={t("copied")}
            copied={props.copiedValue === props.supportNumber}
            onCopy={props.onCopy}
          />
        </>
      ) : null}
      <TextField
        id="sender-ref"
        label={t("senderRef")}
        hint={t("senderRefHint")}
        value={props.senderRef}
        onChange={(event) => props.onSenderChange(event.currentTarget.value)}
        onBlur={props.onSenderBlur}
        autoComplete="tel"
        inputMode="tel"
        required
        {...(props.senderRefTouched && !props.isSenderValid
          ? { error: t("invalidSenderRef") }
          : {})}
      />
    </>
  );
}

function RequestError({ error }: { error: unknown }): React.ReactElement | null {
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
        <PaymentDetails {...props} />
        <RequestError error={props.error} />
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

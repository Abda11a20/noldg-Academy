import { CopyButton, RadioGroup, Text, TextField } from "@noldg/ui";
import type { PaymentMethod } from "@noldg/api/contracts/orders";
import { useTranslation } from "react-i18next";

export type CheckoutMethod = Extract<PaymentMethod, "instapay" | "wallet">;

export interface CheckoutPaymentDetailsProps {
  paymentInstructions: string;
  supportNumber: string | null;
  step: number;
  method: CheckoutMethod;
  senderRef: string;
  senderRefTouched: boolean;
  isSenderValid: boolean;
  copiedValue: string | null;
  onMethodChange: (value: CheckoutMethod) => void;
  onSenderChange: (value: string) => void;
  onSenderBlur: () => void;
  onCopy: (value: string) => void;
}

/** Renders payment method selection, transfer instructions, and sender reference fields.
 * @param props Checkout payment step state and callbacks.
 */
export function CheckoutPaymentDetails(
  props: CheckoutPaymentDetailsProps,
): React.ReactElement | null {
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

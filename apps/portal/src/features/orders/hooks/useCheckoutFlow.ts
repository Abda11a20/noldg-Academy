import { useRef, useState } from "react";
import type { OrderSummary, PaymentMethod } from "@noldg/api/contracts/orders";
import { normalizeArabicDigits } from "../../../shared/normalize-arabic-digits";
import { normalizeEgyptianWhatsappNumber } from "../../../shared/whatsapp/whatsapp";
import { createConfirmationKey, useCreateOrder } from "./useOrders";

export type CheckoutMethod = Extract<PaymentMethod, "instapay" | "wallet">;

/** Owns the local checkout form state and protects one confirmation attempt from duplicate submits.
 * @param productId Product selected by the route.
 * @param isSenderValid Whether the normalized sender number is valid.
 */
export function useCheckoutFlow(productId: string) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<CheckoutMethod>("instapay");
  const [senderRef, setSenderRef] = useState("");
  const isSenderValid = normalizeEgyptianWhatsappNumber(senderRef) !== null;
  const [senderRefTouched, setSenderRefTouched] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderSummary | null>(null);
  const key = useRef("");
  const submitting = useRef(false);
  const create = useCreateOrder();

  const submit = async (): Promise<void> => {
    if (!isSenderValid || submitting.current) return;
    if (!key.current) key.current = createConfirmationKey();
    submitting.current = true;
    try {
      const order = await create.mutateAsync({
        input: {
          productId,
          paymentMethod: method,
          senderRef: normalizeArabicDigits(senderRef).trim(),
        },
        key: key.current,
      });
      setCreatedOrder(order);
    } catch {
      // Keep the fields available because the normalized error toast allows a safe retry.
      return;
    } finally {
      submitting.current = false;
    }
  };

  const changeStep = (nextStep: number): void => {
    if (nextStep > 1) key.current = createConfirmationKey();
    setStep(nextStep);
  };

  return {
    step,
    method,
    setMethod,
    senderRef,
    isSenderValid,
    setSenderRef,
    senderRefTouched,
    setSenderRefTouched,
    createdOrder,
    create,
    submit,
    changeStep,
  };
}

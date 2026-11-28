import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import {
  Button,
  Card,
  CardBody,
  ConfirmDialog,
  ErrorState,
  Heading,
  Text,
  TextField,
} from "@noldg/ui";
import { AppError } from "@noldg/api/errors";
import { formatMoney } from "../../../shared/i18n/formatting";
import { getAdminOrderPath } from "../../../shared/navigation/routes";
import { createConfirmationKey, useCreateManualOrder, usePricingPreview } from "../hooks/useOrders";

/** Provides the supported manual cash order form; live mode degrades when unavailable. */
export function ManualOrderPage() {
  const { t } = useTranslation("orders");
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const [productId, setProductId] = useState("");
  const [senderRef, setSenderRef] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const idempotencyKey = useRef("");
  const create = useCreateManualOrder();
  const pricing = usePricingPreview(productId);
  if (!capabilities.manualOrder)
    return <ErrorState title={t("manualTitle")} description={t("checkoutUnavailable")} />;
  const submit = async () => {
    const result = await create.mutateAsync({
      input: { studentId, productId, paymentMethod: "cash", ...(senderRef ? { senderRef } : {}) },
      key: idempotencyKey.current,
    });
    await navigate(getAdminOrderPath(result.id));
  };
  const openConfirmation = (): void => {
    idempotencyKey.current = createConfirmationKey();
    setConfirmOpen(true);
  };
  const confirmOrder = (): void => {
    setConfirmOpen(false);
    void submit().catch(() => undefined);
  };
  return (
    <section className="space-y-5">
      <Heading level={1}>{t("manualTitle")}</Heading>
      {create.isError ? (
        <ErrorState
          title={t("loadError")}
          description={
            create.error instanceof AppError
              ? t(`errors.${create.error.code}`, { defaultValue: t("errors.REQUEST_FAILED") })
              : t("errors.REQUEST_FAILED")
          }
        />
      ) : null}
      <Card>
        <CardBody className="space-y-4">
          <TextField
            id="manual-student-id"
            label={t("studentId")}
            value={studentId}
            onChange={(event) => setStudentId(event.currentTarget.value)}
            required
          />
          <TextField
            id="manual-product-id"
            label={t("productId")}
            value={productId}
            onChange={(event) => setProductId(event.currentTarget.value)}
            required
          />
          {pricing.data ? (
            <Text>{t("priceNow", { price: formatMoney(pricing.data.pricing.currentPrice) })}</Text>
          ) : null}
          {pricing.isError ? <Text tone="danger">{t("loadError")}</Text> : null}
          <TextField
            id="manual-sender-ref"
            label={t("manualNote")}
            value={senderRef}
            onChange={(event) => setSenderRef(event.currentTarget.value)}
          />
          <Button
            disabled={
              !studentId || !productId || create.isPending || !pricing.data?.pricing.isPurchasable
            }
            loading={create.isPending}
            onClick={openConfirmation}
          >
            {t("createManual")}
          </Button>
        </CardBody>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) idempotencyKey.current = "";
        }}
        title={t("manualConfirmTitle")}
        description={t("manualConfirmDescription")}
        closeLabel={t("back")}
        cancelLabel={t("back")}
        confirmLabel={t("createManual")}
        onConfirm={confirmOrder}
      />
    </section>
  );
}

import { Controller, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MoneyField, RadioGroup } from "@noldg/ui";
import { formatMoney } from "../../../shared/i18n/formatting";
import {
  MAX_CATALOG_PRICE_EGP,
  MIN_CATALOG_PRICE_EGP,
  type CatalogLesson,
} from "@noldg/api/contracts/catalog";
import type { LessonFormValues } from "../schemas/lesson-form";

interface LessonAccessSectionProps {
  control: Control<LessonFormValues>;
  access: LessonFormValues["access"];
  lesson?: CatalogLesson | undefined;
  priceError?: string | undefined;
}

/** Renders free or paid lesson access and its optional amount field. @param props Access and server pricing information. */
export function LessonAccessSection({
  control,
  access,
  lesson,
  priceError,
}: LessonAccessSectionProps) {
  const { t } = useTranslation("catalog");
  return (
    <section className="space-y-4">
      <Controller
        control={control}
        name="access"
        render={({ field }) => (
          <RadioGroup
            id="lesson-access"
            label={t("lessonAccess")}
            onValueChange={field.onChange}
            options={[
              { value: "free", label: t("freeAccess") },
              { value: "paid", label: t("paidAccess") },
            ]}
            value={field.value}
          />
        )}
      />
      {access === "paid" ? (
        <Controller
          control={control}
          name="price"
          render={({ field }) => (
            <MoneyField
              {...field}
              {...(priceError ? { error: priceError } : {})}
              formattedLabel={t("studentPriceNow")}
              formattedValue={
                lesson?.currentStudentPrice === undefined
                  ? t("pricePreviewUnavailable")
                  : formatMoney(lesson.currentStudentPrice)
              }
              id="lesson-price"
              label={t("lessonPrice")}
              max={MAX_CATALOG_PRICE_EGP}
              min={MIN_CATALOG_PRICE_EGP}
            />
          )}
        />
      ) : null}
    </section>
  );
}

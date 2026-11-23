import { useTranslation } from "react-i18next";
import {
  Button,
  Icon,
  Image,
  Link,
  Logo,
  Spinner,
  Text,
  UiProvider,
  VisuallyHidden,
} from "@noldg/ui";
import {
  buttonSizes,
  buttonVariantLabelKeys,
  buttonVariants,
  colorSwatches,
  iconColors,
  iconNames,
  textScaleClasses,
} from "./gallery-constants";
import { GalleryShowcase } from "./GalleryShowcase";
import { GalleryInfrastructure } from "./GalleryInfrastructure";

export interface GalleryDirectionProps {
  direction: "rtl" | "ltr";
}

/** Shows the complete F0 design-system sample set in one text direction. */
export function GalleryDirection({ direction }: GalleryDirectionProps) {
  const { t } = useTranslation("common");
  const directionLabel = direction === "rtl" ? t("directionRtl") : t("directionLtr");

  return (
    <UiProvider direction={direction}>
      <section className="space-y-6 rounded-lg border border-border bg-surface p-6" dir={direction}>
        <h2 className="text-lg font-semibold">{directionLabel}</h2>
        <section aria-label={t("colorTokens")} className="space-y-3">
          <h3 className="text-md font-semibold">{t("colorTokens")}</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {colorSwatches.map((swatch) => (
              <div className={`rounded-md p-3 ${swatch.classes}`} key={swatch.key}>
                {t(swatch.key)}
              </div>
            ))}
          </div>
        </section>
        <section aria-label={t("typographyScale")} className="space-y-3">
          <h3 className="text-md font-semibold">{t("typographyScale")}</h3>
          {textScaleClasses.map((className) => (
            <p className={className} key={className}>
              {t("typographySample")}
            </p>
          ))}
        </section>
        <section aria-label={t("componentVariants")} className="space-y-3">
          <h3 className="text-md font-semibold">{t("componentVariants")}</h3>
          {buttonVariants.map((variant) => (
            <div className="flex flex-wrap items-center gap-3" key={variant}>
              {buttonSizes.map((size) => (
                <Button key={`${variant}-${size}`} size={size} variant={variant}>
                  {t(buttonVariantLabelKeys[variant])}
                </Button>
              ))}
            </div>
          ))}
          <Button iconStart="search" iconEnd="chevronEnd" onClick={() => undefined}>
            {t("continue")}
          </Button>
          <Button loading onClick={() => undefined}>
            {t("loading")}
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            {iconNames.map((name) => (
              <Icon direction={direction} key={name} name={name} />
            ))}
            {iconColors.map((color) => (
              <Icon color={color} key={color} name="check" />
            ))}
            <Spinner />
          </div>
          <Logo alt={t("logoAlt")} className="w-40" />
          <Image alt={t("imageSample")} asset="wordmark" fixedAspect />
          <VisuallyHidden>{t("hiddenDemo")}</VisuallyHidden>
        </section>
        <Link to="/login">{t("goHome")}</Link>
        <Text>{t("typographySample")}</Text>
        <Button disabled>{t("sampleAction")}</Button>
        <Button aria-label={t("sampleSearch")} iconOnly iconStart="search" variant="secondary" />
        <GalleryShowcase direction={direction} />
        <GalleryInfrastructure />
      </section>
    </UiProvider>
  );
}

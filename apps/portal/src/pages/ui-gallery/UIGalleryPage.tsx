import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../../shared/navigation/LanguageSwitcher";
import { GalleryDirection } from "./GalleryDirection";

/** Development-only route displaying design tokens and all F0 UI components. */
export function UIGalleryPage() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6" data-gallery-build-marker="noldg-academy-ui-gallery-dev-only">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-bold">{t("uiGallery")}</h1>
      <GalleryDirection direction="rtl" />
      <GalleryDirection direction="ltr" />
    </div>
  );
}

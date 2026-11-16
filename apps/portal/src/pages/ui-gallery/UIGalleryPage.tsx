import { useTranslation } from "react-i18next";
import { GalleryDirection } from "./GalleryDirection";

/** Development-only route displaying design tokens and all F0 UI components. */
export function UIGalleryPage() {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("uiGallery")}</h1>
      <GalleryDirection direction="rtl" />
      <GalleryDirection direction="ltr" />
    </div>
  );
}

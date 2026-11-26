import { useTranslation } from "react-i18next";
import { capabilities } from "@noldg/api/config/capabilities";
import { apiMode } from "@noldg/api/mocks/mode";
import { Text } from "@noldg/ui";

/** Explains live-backend browse features that are not yet supported. */
export function BrowseCapabilityNotice() {
  const { t } = useTranslation("browse");
  const trackUnavailable = !capabilities.studentTrackFilter && apiMode === "live";
  const filtersUnavailable = !capabilities.teacherBrowseFilters && apiMode === "live";
  if (!trackUnavailable && !filtersUnavailable) return null;
  return (
    <div className="flex flex-col gap-2" role="status">
      {trackUnavailable ? <Text tone="muted">{t("trackFilterUnavailable")}</Text> : null}
      {filtersUnavailable ? <Text tone="muted">{t("filtersUnavailable")}</Text> : null}
    </div>
  );
}

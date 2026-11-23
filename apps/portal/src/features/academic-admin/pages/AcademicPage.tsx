import { useTranslation } from "react-i18next";
import { Heading, Tabs } from "@noldg/ui";
import { TracksPanel } from "../components/TracksPanel";
import { SubjectsPanel } from "../components/SubjectsPanel";
import { TrackSubjectsPanel } from "../components/TrackSubjectsPanel";

/** Composes academic tracks, subjects, and track-subject management tabs.
 * @returns Academic administration page.
 */
export function AcademicPage() {
  const { t } = useTranslation("admin");
  return (
    <div className="space-y-6">
      <div>
        <Heading level={1}>{t("academic.title")}</Heading>
        <p className="mt-2 text-foreground-muted">{t("academic.description")}</p>
      </div>
      <Tabs
        label={t("academic.title")}
        items={[
          { value: "tracks", label: t("academic.tabs.tracks"), content: <TracksPanel /> },
          { value: "subjects", label: t("academic.tabs.subjects"), content: <SubjectsPanel /> },
          { value: "mapping", label: t("academic.tabs.mapping"), content: <TrackSubjectsPanel /> },
        ]}
      />
    </div>
  );
}

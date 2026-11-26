import { useTranslation } from "react-i18next";
import { Select } from "@noldg/ui";
import { STUDENT_BROWSE_TRACKS } from "../constants";

interface StudentTrackSelectorProps {
  trackId?: string;
  onChange: (trackId: string) => void;
}

/** Renders the manual track choice when the authenticated profile has no track. */
export function StudentTrackSelector({ trackId, onChange }: StudentTrackSelectorProps) {
  const { t } = useTranslation("browse");
  return (
    <Select
      id="student-track"
      label={t("trackLabel")}
      placeholder={t("chooseTrack")}
      value={trackId ?? ""}
      options={STUDENT_BROWSE_TRACKS.map(({ id, labelKey }) => ({ value: id, label: t(labelKey) }))}
      onValueChange={onChange}
    />
  );
}

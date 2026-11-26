import { useTranslation } from "react-i18next";
import { Badge, Button, Heading, Text } from "@noldg/ui";
import { useAuthSnapshot } from "../../../shared/auth/auth-store";
import { StudentTrackSelector } from "../components/StudentTrackSelector";
import { ROUTE_PATHS } from "../../../shared/navigation/routes";
import { STUDENT_BROWSE_TRACKS } from "../constants";
import { useStudentTrack } from "../hooks/useStudentTrack";

/** Renders the student's minimal home with profile track or a URL-backed choice. */
export function StudentHomePage() {
  const { t } = useTranslation("browse");
  const user = useAuthSnapshot().user;
  const { trackId, manual, setTrack } = useStudentTrack();
  const track = STUDENT_BROWSE_TRACKS.find((item) => item.id === trackId);
  return (
    <section className="flex flex-col gap-5">
      <Heading level={1}>{t("homeGreeting", { name: user?.name ?? "" })}</Heading>
      {track && !manual ? (
        <Badge tone="primary">{t(track.labelKey)}</Badge>
      ) : (
        <>
          <Text tone="muted">{t("chooseTrackPrompt")}</Text>
          <StudentTrackSelector {...(trackId ? { trackId } : {})} onChange={setTrack} />
        </>
      )}
      <div>
        <Button to={ROUTE_PATHS.studentTeachers} variant="primary">
          {t("findTeachers")}
        </Button>
      </div>
    </section>
  );
}

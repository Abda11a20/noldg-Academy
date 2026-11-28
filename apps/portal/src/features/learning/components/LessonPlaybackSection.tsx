import { useTranslation } from "react-i18next";
import { Button, ProgressBar } from "@noldg/ui";
import type { StudentLesson } from "@noldg/api/contracts/learning";
import type { usePlaybackSession } from "../hooks/usePlaybackSession";
import { LessonVideo } from "./LessonVideo";
import { PlaybackStatusNotice } from "./PlaybackStatusNotice";

type PlaybackController = ReturnType<typeof usePlaybackSession>;

/** Renders start, file player, server progress, and playback status for a lesson.
 * @param props Lesson access and playback state controlled by the session hook.
 */
export function LessonPlaybackSection({
  lesson,
  playback,
  progress,
}: {
  lesson: StudentLesson;
  playback: PlaybackController;
  progress?: number;
}) {
  const { t } = useTranslation("learning");
  const session = playback.session;
  const canStart = lesson.availability === "available" && lesson.access !== "not_owned";
  const hasPlayer = canStart && session !== null;
  return (
    <>
      <PlaybackStatusNotice status={playback.status} start={playback.start} />
      {canStart && !session && playback.status !== "replaced" ? (
        <Button
          disabled={playback.status === "starting"}
          onClick={() => void playback.start()}
          variant="primary"
        >
          {t("player.start")}
        </Button>
      ) : null}
      {hasPlayer && session ? (
        <LessonVideo lesson={lesson} playback={playback} session={session} />
      ) : null}
      {typeof progress === "number" ? (
        <ProgressBar label={t("myLessons.progress", { title: lesson.title })} value={progress} />
      ) : null}
    </>
  );
}

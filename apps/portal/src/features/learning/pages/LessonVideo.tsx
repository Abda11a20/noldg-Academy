import { useTranslation } from "react-i18next";
import { Alert, Text, VideoPlayer } from "@noldg/ui";
import { capabilities } from "@noldg/api/config/capabilities";
import type { PlaybackSession, StudentLesson } from "@noldg/api/contracts/learning";
import type { usePlaybackSession } from "../hooks/usePlaybackSession";

type PlaybackController = ReturnType<typeof usePlaybackSession>;

/** Renders an active file source with the server watermark and localized controls.
 * @param props Lesson metadata and active playback session callbacks.
 */
export function LessonVideo({
  lesson,
  playback,
  session,
}: {
  lesson: StudentLesson;
  playback: PlaybackController;
  session: PlaybackSession;
}) {
  const { t } = useTranslation(["learning", "common"]);
  return (
    <>
      {capabilities.deliveryIsDownloadable ? (
        <Alert tone="warning" title={t("player.downloadableWarning")}>
          <Text>{t("player.downloadableDescription")}</Text>
        </Alert>
      ) : null}
      <VideoPlayer
        id={`lesson-player-${lesson.id}`}
        source={{ method: session.source.method, url: session.source.url }}
        startPositionSeconds={session.startPositionSeconds}
        watermarkText={session.watermark.text}
        labels={{
          ...t("player.controls", { returnObjects: true }),
          timeValue: (current, duration) => t("common:playerTime", { current, duration }),
          rateValue: (rate) => t("player.rateValue", { rate }),
        }}
        onPlay={playback.onPlay}
        onPause={playback.onPause}
        onTimeUpdate={playback.updatePosition}
        onRateChange={playback.updateRate}
        onEnded={playback.onEnded}
      />
    </>
  );
}

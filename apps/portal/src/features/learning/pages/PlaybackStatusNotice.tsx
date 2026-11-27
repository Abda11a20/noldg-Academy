import { useTranslation } from "react-i18next";
import { Alert, Button, Text } from "@noldg/ui";
import type { PlaybackStatus } from "../hooks/usePlaybackSession";

/** Renders retry and replacement notices returned by the playback session state.
 * @param props Current server-session state and retry action.
 */
export function PlaybackStatusNotice({
  status,
  start,
}: {
  status: PlaybackStatus;
  start: () => Promise<void>;
}) {
  const { t } = useTranslation("learning");
  if (status === "replaced") {
    return (
      <Alert tone="warning" title={t("player.replacedTitle")}>
        <Text>{t("player.replacedDescription")}</Text>
        <Button onClick={() => void start()} variant="primary">
          {t("player.continueHere")}
        </Button>
      </Alert>
    );
  }
  if (status === "failed") {
    return (
      <Alert tone="danger" title={t("player.failedTitle")}>
        <Button onClick={() => void start()} variant="secondary">
          {t("myLessons.retry")}
        </Button>
      </Alert>
    );
  }
  return null;
}

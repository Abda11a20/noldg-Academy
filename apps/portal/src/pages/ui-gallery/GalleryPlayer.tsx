import { useTranslation } from "react-i18next";
import { VideoPlayer } from "@noldg/ui";

/** Demonstrates the file player controls and watermark in the development gallery.
 * @param props Direction used to keep sample player control IDs unique.
 */
export function GalleryPlayer({ direction }: { direction: "rtl" | "ltr" }) {
  const { t } = useTranslation("common");
  return (
    <section aria-label={t("galleryPlayer")} className="space-y-3">
      <h3 className="text-md font-semibold">{t("galleryPlayer")}</h3>
      <VideoPlayer
        source={{ method: "file", url: "https://media.example.test/gallery.mp4" }}
        id={`gallery-video-player-${direction}`}
        watermarkText={t("galleryWatermark")}
        labels={{
          play: t("playerPlay"),
          pause: t("playerPause"),
          seek: t("playerSeek"),
          volume: t("playerVolume"),
          mute: t("playerMute"),
          unmute: t("playerUnmute"),
          fullscreen: t("playerFullscreen"),
          speed: t("playerSpeed"),
          unsupported: t("playerUnsupported"),
          timeValue: (current, duration) => t("playerTime", { current, duration }),
          rateValue: (rate) => t("playerRate", { rate }),
        }}
      />
    </section>
  );
}

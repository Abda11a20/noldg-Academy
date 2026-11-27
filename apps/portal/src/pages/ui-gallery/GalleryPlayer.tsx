import { useTranslation } from "react-i18next";
import { VideoPlayer } from "@noldg/ui";

/** Demonstrates the file player controls and watermark in the development gallery.
 * @param props Direction used to keep sample player control IDs unique.
 */
export function GalleryPlayer({ direction }: { direction: "rtl" | "ltr" }) {
  const { t } = useTranslation(["gallery", "common"]);
  return (
    <section aria-label={t("galleryPlayer")} className="space-y-3">
      <h3 className="text-md font-semibold">{t("galleryPlayer")}</h3>
      <VideoPlayer
        source={{ method: "file", url: "https://media.example.test/gallery.mp4" }}
        id={`gallery-video-player-${direction}`}
        watermarkText={t("galleryWatermark")}
        labels={{
          play: t("common:playerPlay"),
          pause: t("common:playerPause"),
          seek: t("common:playerSeek"),
          volume: t("common:playerVolume"),
          mute: t("common:playerMute"),
          unmute: t("common:playerUnmute"),
          fullscreen: t("common:playerFullscreen"),
          speed: t("common:playerSpeed"),
          unsupported: t("common:playerUnsupported"),
          timeValue: (current, duration) => t("common:playerTime", { current, duration }),
          rateValue: (rate) => t("common:playerRate", { rate }),
        }}
      />
    </section>
  );
}

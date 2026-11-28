import { useRef, useState, type KeyboardEvent, type SyntheticEvent } from "react";
import { Text } from "../typography/Text";
import { PlayerControls } from "./PlayerControls";
import { Watermark } from "./Watermark";
import { SEEK_STEP_SECONDS } from "./player-constants";

export { PLAYBACK_RATES } from "./player-constants";

export interface VideoPlayerLabels {
  play: string;
  pause: string;
  seek: string;
  volume: string;
  mute: string;
  unmute: string;
  fullscreen: string;
  speed: string;
  unsupported: string;
  timeValue: (currentSeconds: number, durationSeconds: number) => string;
  rateValue: (rate: number) => string;
}

export interface VideoPlayerProps {
  id: string;
  source: { method: string; url: string };
  labels: VideoPlayerLabels;
  watermarkText?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (positionSeconds: number) => void;
  onRateChange?: (rate: number) => void;
  onTimeUpdate?: (positionSeconds: number) => void;
  onEnded?: () => void;
  onError?: () => void;
  startPositionSeconds?: number;
}

function mediaTime(event: SyntheticEvent<HTMLVideoElement>) {
  return { currentTime: event.currentTarget.currentTime, duration: event.currentTarget.duration };
}

/** Renders the file-source video player with accessible custom controls and keyboard shortcuts.
 * @param props Normalized source, event callbacks, and localized control labels; other source methods show an unsupported state.
 */
export function VideoPlayer(props: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [position, setPosition] = useState(props.startPositionSeconds ?? 0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);

  const seek = (next: number) => {
    const media = mediaRef.current as HTMLVideoElement;
    media.currentTime = Math.max(0, Math.min(next, media.duration || next));
    setPosition(media.currentTime);
    props.onSeek?.(media.currentTime);
  };
  const togglePlayback = () => {
    const media = mediaRef.current as HTMLVideoElement;
    if (media.paused) void Promise.resolve(media.play()).catch(() => undefined);
    else media.pause();
  };
  const toggleFullscreen = () => {
    const action = document.fullscreenElement
      ? document.exitFullscreen()
      : rootRef.current?.requestFullscreen();
    void Promise.resolve(action).catch(() => undefined);
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    (mediaRef.current as HTMLVideoElement).muted = next;
  };
  const setVolumeValue = (next: number) => {
    setVolume(next);
    (mediaRef.current as HTMLVideoElement).volume = next;
  };
  const setPlaybackRate = (next: number) => {
    setRate(next);
    (mediaRef.current as HTMLVideoElement).playbackRate = next;
    props.onRateChange?.(next);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLVideoElement>) => {
    const keys: Record<string, () => void> = {
      " ": togglePlayback,
      Space: togglePlayback,
      k: togglePlayback,
      K: togglePlayback,
      ArrowLeft: () => seek(position - SEEK_STEP_SECONDS),
      ArrowRight: () => seek(position + SEEK_STEP_SECONDS),
      m: toggleMute,
      M: toggleMute,
      f: toggleFullscreen,
      F: toggleFullscreen,
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  if (props.source.method !== "file") return <Text role="status">{props.labels.unsupported}</Text>;
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-foreground text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      ref={rootRef}
    >
      <video
        aria-label={props.labels.play}
        className="aspect-video w-full"
        disablePictureInPicture
        controlsList="nodownload noremoteplayback"
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={onKeyDown}
        onLoadedMetadata={(event) => {
          const media = event.currentTarget;
          const start = props.startPositionSeconds ?? 0;
          media.currentTime =
            Number.isFinite(media.duration) && media.duration > 0
              ? Math.min(Math.max(start, 0), media.duration)
              : start;
          setDuration(media.duration);
          setPosition(media.currentTime);
        }}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onEnded={() => {
          setPlaying(false);
          props.onEnded?.();
        }}
        onError={() => props.onError?.()}
        onPause={() => {
          setPlaying(false);
          props.onPause?.();
        }}
        onPlay={() => {
          setPlaying(true);
          props.onPlay?.();
        }}
        onTimeUpdate={(event) => {
          const time = mediaTime(event);
          setPosition(time.currentTime);
          setDuration(time.duration);
          props.onTimeUpdate?.(time.currentTime);
        }}
        ref={mediaRef}
        src={props.source.url}
        tabIndex={0}
      >
        <track kind="captions" label={props.labels.play} srcLang="en" />
      </video>
      <Watermark text={props.watermarkText ?? ""} />
      <PlayerControls
        duration={duration}
        id={props.id}
        labels={props.labels}
        muted={muted}
        onFullscreen={toggleFullscreen}
        onRateChange={setPlaybackRate}
        onSeek={seek}
        onToggleMute={toggleMute}
        onTogglePlayback={togglePlayback}
        onVolumeChange={setVolumeValue}
        playing={playing}
        position={position}
        rate={rate}
        volume={volume}
      />
    </div>
  );
}

import { Button } from "../button/Button";
import { Icon } from "../icon/Icon";
import { Select } from "../forms/Select";
import { Text } from "../typography/Text";
import type { VideoPlayerLabels } from "./VideoPlayer";
import { PLAYBACK_RATES } from "./player-constants";
import { SeekBar } from "./SeekBar";

export interface PlayerControlsProps {
  id: string;
  labels: VideoPlayerLabels;
  playing: boolean;
  muted: boolean;
  volume: number;
  position: number;
  duration: number;
  rate: number;
  onTogglePlayback: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (positionSeconds: number) => void;
  onRateChange: (rate: number) => void;
  onFullscreen: () => void;
}

/** Renders the accessible controls for VideoPlayer.
 * @param props Localized control labels, current media state, and event callbacks.
 */
export function PlayerControls(props: PlayerControlsProps) {
  const currentTimeLabel = props.labels.timeValue(
    Math.floor(props.position),
    Number.isFinite(props.duration) ? Math.floor(props.duration) : 0,
  );
  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <Button
        aria-label={props.playing ? props.labels.pause : props.labels.play}
        onClick={props.onTogglePlayback}
        size="sm"
        variant="ghost"
      >
        <Icon name={props.playing ? "pause" : "play"} />
      </Button>
      <Text aria-label={currentTimeLabel} size="sm">
        {currentTimeLabel}
      </Text>
      <div className="min-w-32 flex-1">
        <SeekBar
          label={props.labels.seek}
          currentTime={props.position}
          duration={props.duration}
          onSeek={props.onSeek}
        />
      </div>
      <input
        aria-label={props.labels.volume}
        className="w-20 accent-primary"
        max={1}
        min={0}
        onChange={(event) => props.onVolumeChange(Number(event.currentTarget.value))}
        step={0.05}
        type="range"
        value={props.volume}
      />
      <Button
        aria-label={props.muted ? props.labels.unmute : props.labels.mute}
        onClick={props.onToggleMute}
        size="sm"
        variant="ghost"
      >
        {props.muted ? props.labels.unmute : props.labels.mute}
      </Button>
      <Select
        id={`${props.id}-speed`}
        label={props.labels.speed}
        onValueChange={(value) => props.onRateChange(Number(value))}
        options={PLAYBACK_RATES.map((value) => ({
          value: String(value),
          label: props.labels.rateValue(value),
        }))}
        placeholder={props.labels.rateValue(props.rate)}
        value={String(props.rate)}
      />
      <Button
        aria-label={props.labels.fullscreen}
        onClick={props.onFullscreen}
        size="sm"
        variant="ghost"
      >
        <Icon name="video" />
      </Button>
    </div>
  );
}

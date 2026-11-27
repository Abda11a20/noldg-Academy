import { axe } from "jest-axe";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SeekBar } from "./SeekBar";
import { VideoPlayer, type VideoPlayerLabels } from "./VideoPlayer";
import { Watermark } from "./Watermark";

const labels: VideoPlayerLabels = {
  play: "Play video",
  pause: "Pause video",
  seek: "Seek video",
  volume: "Volume",
  mute: "Mute video",
  unmute: "Unmute video",
  fullscreen: "Full screen",
  speed: "Playback speed",
  unsupported: "Unsupported video",
  timeValue: (current, total) => `${current} / ${total}`,
  rateValue: (rate) => `${rate} times`,
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("renders unsupported sources and has no accessibility violations", async () => {
  const { container } = render(
    <VideoPlayer
      id="video-player"
      source={{ method: "hls", url: "https://video.test/stream" }}
      labels={labels}
    />,
  );
  expect(screen.getByRole("status").textContent).toBe("Unsupported video");
  expect((await axe(container)).violations).toHaveLength(0);
});

it("renders file controls, applies callbacks and keyboard shortcuts", async () => {
  const onSeek = vi.fn();
  const onPlay = vi.fn();
  const onPause = vi.fn();
  const onEnded = vi.fn();
  const onError = vi.fn();
  const onTimeUpdate = vi.fn();
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(async () => undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  const fullscreen = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
    configurable: true,
    value: fullscreen,
  });
  const { container } = render(
    <VideoPlayer
      id="video-player"
      source={{ method: "file", url: "https://video.test/movie.mp4" }}
      labels={labels}
      onSeek={onSeek}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      onError={onError}
      onTimeUpdate={onTimeUpdate}
      watermarkText="Student"
    />,
  );
  const media = container.querySelector("video");
  Object.defineProperty(media, "duration", { configurable: true, value: 20 });
  expect(media?.getAttribute("controlslist")).toContain("nodownload");
  expect(media?.hasAttribute("disablepictureinpicture")).toBe(true);
  const keyboardTarget = media as HTMLVideoElement;
  Object.defineProperty(media, "duration", { configurable: true, value: 0 });
  fireEvent.keyDown(keyboardTarget, { key: "ArrowLeft" });
  expect(onSeek).toHaveBeenLastCalledWith(0);
  Object.defineProperty(media, "duration", { configurable: true, value: 20 });
  fireEvent.keyDown(keyboardTarget, { key: " " });
  expect(play).toHaveBeenCalledOnce();
  Object.defineProperty(media, "paused", { configurable: true, value: false });
  fireEvent.keyDown(keyboardTarget, { key: "K" });
  expect(pause).toHaveBeenCalledOnce();
  fireEvent.keyDown(keyboardTarget, { key: "ArrowRight" });
  expect(onSeek).toHaveBeenCalledWith(10);
  fireEvent.keyDown(keyboardTarget, { key: "ArrowLeft" });
  expect(onSeek).toHaveBeenLastCalledWith(0);
  fireEvent.keyDown(keyboardTarget, { key: "ArrowRight" });
  fireEvent.keyDown(keyboardTarget, { key: "ArrowRight" });
  fireEvent.keyDown(keyboardTarget, { key: "ArrowRight" });
  expect(onSeek).toHaveBeenLastCalledWith(20);
  fireEvent.keyDown(keyboardTarget, { key: "x" });
  fireEvent.keyDown(keyboardTarget, { key: "F" });
  expect(fullscreen).toHaveBeenCalledOnce();
  fireEvent.keyDown(keyboardTarget, { key: "f" });
  fireEvent.keyDown(keyboardTarget, { key: "k" });
  fireEvent.click(screen.getByRole("button", { name: "Full screen" }));
  expect(fullscreen).toHaveBeenCalledTimes(3);
  fireEvent.click(screen.getByRole("button", { name: "Mute video" }));
  expect(media?.muted).toBe(true);
  fireEvent.keyDown(keyboardTarget, { key: "M" });
  expect(media?.muted).toBe(false);
  fireEvent.keyDown(screen.getByRole("slider", { name: "Seek video" }), { key: "ArrowRight" });
  expect(onSeek).toHaveBeenLastCalledWith(20);
  fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "0.5" } });
  expect(media?.volume).toBe(0.5);
  fireEvent.contextMenu(media as HTMLVideoElement);
  fireEvent.play(media as HTMLVideoElement);
  expect(onPlay).toHaveBeenCalledOnce();
  fireEvent.timeUpdate(media as HTMLVideoElement);
  fireEvent.pause(media as HTMLVideoElement);
  fireEvent.ended(media as HTMLVideoElement);
  fireEvent.error(media as HTMLVideoElement);
  expect(onPause).toHaveBeenCalledOnce();
  expect(onEnded).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledOnce();
  expect(onTimeUpdate).toHaveBeenCalledOnce();
  expect((await axe(container)).violations).toHaveLength(0);
});

it("handles missing callbacks, duration changes, and alternate keyboard play keys", () => {
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockImplementation(async () => undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  const { container } = render(
    <VideoPlayer
      id="video-player"
      source={{ method: "file", url: "https://video.test/movie.mp4" }}
      labels={labels}
    />,
  );
  const media = container.querySelector("video") as HTMLVideoElement;
  fireEvent.keyDown(media, { key: "k" });
  expect(play).toHaveBeenCalledOnce();
  Object.defineProperty(media, "paused", { configurable: true, value: false });
  fireEvent.keyDown(media, { key: "Space" });
  expect(pause).toHaveBeenCalledOnce();
  fireEvent.loadedMetadata(media);
  Object.defineProperty(media, "duration", { configurable: true, value: Number.POSITIVE_INFINITY });
  fireEvent.durationChange(media);
  expect(screen.getByText("0 / 0")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Mute video" }));
  expect(media.muted).toBe(true);
});

it("clamps seek position and reports speed and progress callbacks", () => {
  const onSeek = vi.fn();
  const onRateChange = vi.fn();
  const { container } = render(
    <VideoPlayer
      id="video-player"
      source={{ method: "file", url: "https://video.test/movie.mp4" }}
      labels={labels}
      onSeek={onSeek}
      onRateChange={onRateChange}
      startPositionSeconds={12}
    />,
  );
  const media = container.querySelector("video") as HTMLVideoElement;
  Object.defineProperty(media, "duration", { configurable: true, value: 20 });
  Object.defineProperty(media, "currentTime", { configurable: true, writable: true, value: 12 });
  fireEvent.loadedMetadata(media);
  fireEvent.timeUpdate(media);
  fireEvent.change(screen.getByRole("slider", { name: "Seek video" }), { target: { value: "19" } });
  expect(onSeek).toHaveBeenCalledWith(19);
  expect(screen.getByText("19 / 20")).toBeTruthy();
  fireEvent.click(screen.getByRole("combobox", { name: "Playback speed" }));
  fireEvent.click(screen.getByText("2 times"));
  expect(onRateChange).toHaveBeenCalledWith(2);
});

it("disables the seek bar when duration is unavailable and reports valid seeks", async () => {
  const onSeek = vi.fn();
  const { container, rerender } = render(
    <SeekBar label="Position" currentTime={4} duration={0} onSeek={onSeek} />,
  );
  expect(screen.getByRole("slider", { name: "Position" }).hasAttribute("disabled")).toBe(true);
  expect((await axe(container)).violations).toHaveLength(0);
  rerender(<SeekBar label="Position" currentTime={4} duration={10} onSeek={onSeek} />);
  fireEvent.change(screen.getByRole("slider", { name: "Position" }), { target: { value: "8" } });
  expect(onSeek).toHaveBeenCalledWith(8);
});

it("moves a visible watermark deterministically and renders no empty watermark", async () => {
  const empty = render(<Watermark text="" />);
  expect((await axe(empty.container)).violations).toHaveLength(0);
  cleanup();
  const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(0.75);
  vi.useFakeTimers();
  const { container, rerender } = render(<Watermark text="Student watermark" random={random} />);
  expect(screen.getByText("Student watermark").className).toContain("start-4 top-4");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(12_000);
  });
  expect(screen.getByText("Student watermark").className).toContain("end-4 top-4");
  expect(random).toHaveBeenCalledOnce();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(12_000);
  });
  expect(screen.getByText("Student watermark").className).toContain("end-4 bottom-16");
  expect(random).toHaveBeenCalledTimes(2);
  rerender(<Watermark text="" random={random} />);
  expect(container.firstChild).toBeNull();
});

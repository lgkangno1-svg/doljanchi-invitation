import { describe, expect, it, vi } from "vitest";
import { shouldPlayViewportVideo, syncViewportVideo } from "../client/src/lib/viewport-video";

describe("viewport invitation video playback", () => {
  it("plays only when a muted video enters the viewport without reduced motion", async () => {
    const video = { play: vi.fn(async () => undefined), pause: vi.fn() };
    expect(shouldPlayViewportVideo(true, false)).toBe(true);
    await expect(syncViewportVideo(video, true, false)).resolves.toBe(true);
    expect(video.play).toHaveBeenCalledOnce();
    expect(video.pause).not.toHaveBeenCalled();
  });

  it("pauses when the video leaves the viewport or motion is reduced", async () => {
    const video = { play: vi.fn(async () => undefined), pause: vi.fn() };
    await expect(syncViewportVideo(video, false, false)).resolves.toBe(false);
    await expect(syncViewportVideo(video, true, true)).resolves.toBe(false);
    expect(video.pause).toHaveBeenCalledTimes(2);
  });
});

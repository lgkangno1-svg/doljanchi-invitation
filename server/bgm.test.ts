import { describe, expect, it } from "vitest";
import { shouldShowBgmGuide } from "../client/src/lib/bgm";

describe("BGM guidance", () => {
  it("shows on a first visit before music starts", () => {
    expect(shouldShowBgmGuide(false, false)).toBe(true);
  });

  it("stays dismissed after successful playback starts, even when paused later", () => {
    expect(shouldShowBgmGuide(true, true)).toBe(false);
    expect(shouldShowBgmGuide(true, false)).toBe(false);
  });
});

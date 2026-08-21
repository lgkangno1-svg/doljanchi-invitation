import { describe, expect, it } from "vitest";
import { absoluteShareUrl, resolveShareImage } from "./shareMeta";

describe("sharing metadata", () => {
  const fallback = "/manus-storage/default-card.png";

  it("uses a stored image hero for sharing", () => {
    expect(resolveShareImage(JSON.stringify({ kind: "image", url: "/manus-storage/invitations/1/chaewon.png" }), fallback)).toBe("/manus-storage/invitations/1/chaewon.png");
  });

  it("keeps a stable fallback for video or untrusted media paths", () => {
    expect(resolveShareImage(JSON.stringify({ kind: "video", url: "/manus-storage/invitations/1/chaewon.mp4" }), fallback)).toBe(fallback);
    expect(resolveShareImage(JSON.stringify({ kind: "image", url: "https://example.invalid/image.png" }), fallback)).toBe(fallback);
  });

  it("builds an absolute card URL for the active domain", () => {
    expect(absoluteShareUrl("https://doljanchi.example/", "/manus-storage/card.png")).toBe("https://doljanchi.example/manus-storage/card.png");
  });
});

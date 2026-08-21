import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, safeMediaFileName, validateMediaUpload } from "./media";

const toBase64 = (bytes: number[]) => Buffer.from(bytes).toString("base64");

describe("media upload validation", () => {
  it("accepts a GIF with the correct file signature", () => {
    const result = validateMediaUpload("chaewon.gif", "image/gif", toBase64([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00]));
    expect(result.kind).toBe("image");
  });

  it("accepts a WEBM video with the expected file signature", () => {
    const result = validateMediaUpload("chaewon.webm", "video/webm", toBase64([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00]));
    expect(result.kind).toBe("video");
  });

  it("rejects a MIME type whose bytes do not match the claimed media", () => {
    expect(() => validateMediaUpload("not-a-photo.jpg", "image/jpeg", toBase64([0x47, 0x49, 0x46, 0x38]))).toThrow("일치하지 않아요");
  });

  it("uses media-specific size limits and normalizes storage names", () => {
    expect(MAX_VIDEO_BYTES).toBeGreaterThan(MAX_IMAGE_BYTES);
    expect(safeMediaFileName("채원이 첫돌!.mp4")).toMatch(/\.mp4$/);
  });
});
